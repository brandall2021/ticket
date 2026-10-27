import { Client, type ClientChannel } from "ssh2"
import { randomUUID } from "node:crypto"
import { formatSshFingerprint, sshFingerprintMatches, ServerError } from "./servers"

/** Máximo de caracteres que se guardan para reproducir cuando el cliente se conecta tarde. */
const MAX_REPLAY_CHARS = 64 * 1024
/** Una sesión sin actividad durante este tiempo se cierra sola. */
const IDLE_TIMEOUT_MS = 30 * 60 * 1000
/** Tope de sesiones SSH simultáneas en todo el proceso. */
const MAX_SESSIONS = 30
const READY_TIMEOUT_MS = 20_000
const SWEEP_INTERVAL_MS = 60_000

export type SshSessionStatus = "ABRIENDO" | "ACTIVA" | "CERRADA" | "ERROR"

export interface SshConnectOptions {
  /** Identificador pregenerado para poder registrar la auditoría antes de conectar. */
  sessionId?: string
  userId: string
  serverId: string
  serverNombre: string
  host: string
  port: number
  username: string
  password?: string | null
  privateKey?: string | null
  passphrase?: string | null
  /** Huella `SHA256:...` guardada; si existe se exige coincidencia (TOFU). */
  expectedFingerprint?: string | null
  cols?: number
  rows?: number
  /** Se invoca exactamente una vez al cerrar, para persistir la auditoría. */
  onFinalize?: (info: SshFinalizeInfo) => void | Promise<void>
}

export interface SshFinalizeInfo {
  estado: "CERRADA" | "ERROR"
  error: string | null
  duracion: number
}

export interface SshSessionMeta {
  id: string
  userId: string
  serverId: string
  serverNombre: string
  host: string
  port: number
  username: string
  fingerprint: string | null
  cols: number
  rows: number
  iniciada: number
  ultimaActividad: number
  estado: SshSessionStatus
  error: string | null
}

interface LiveSession {
  meta: SshSessionMeta
  client: Client
  channel?: ClientChannel
  listeners: Set<(chunk: string) => void>
  closeListeners: Set<(info: { error: string | null }) => void>
  replay: string
  closed: boolean
  mismatch: boolean
  onFinalize?: (info: SshFinalizeInfo) => void | Promise<void>
}

const REGISTRY_KEY = "__helpdeskSshSessions"
const SWEEP_KEY = "__helpdeskSshSweep"

function registry(): Map<string, LiveSession> {
  const store = globalThis as unknown as Record<string, Map<string, LiveSession> | undefined>
  let sessions = store[REGISTRY_KEY]
  if (!sessions) {
    sessions = new Map<string, LiveSession>()
    store[REGISTRY_KEY] = sessions
  }
  return sessions
}

function ensureSweeper() {
  const store = globalThis as unknown as Record<string, NodeJS.Timeout | undefined>
  if (store[SWEEP_KEY]) return
  const timer = setInterval(() => {
    const now = Date.now()
    for (const session of registry().values()) {
      if (now - session.meta.ultimaActividad > IDLE_TIMEOUT_MS) {
        finalize(session, "CERRADA", "Sesión cerrada por inactividad")
      }
    }
  }, SWEEP_INTERVAL_MS)
  timer.unref?.()
  store[SWEEP_KEY] = timer
}

function clampDimension(value: number | undefined, fallback: number, min: number, max: number): number {
  if (!value || !Number.isFinite(value)) return fallback
  return Math.min(Math.max(Math.round(value), min), max)
}

export function getSshSession(id: string, userId?: string): SshSessionMeta | null {
  const session = registry().get(id)
  if (!session) return null
  if (userId && session.meta.userId !== userId) return null
  return { ...session.meta }
}

export function listSshSessions(userId?: string): SshSessionMeta[] {
  return Array.from(registry().values())
    .filter(session => !userId || session.meta.userId === userId)
    .map(session => ({ ...session.meta }))
}

function pushOutput(session: LiveSession, chunk: string) {
  session.meta.ultimaActividad = Date.now()
  session.replay += chunk
  if (session.replay.length > MAX_REPLAY_CHARS) {
    session.replay = session.replay.slice(-MAX_REPLAY_CHARS)
  }
  for (const listener of session.listeners) {
    try {
      listener(chunk)
    } catch {
      // un cliente roto no debe cortar la sesión
    }
  }
}

function finalize(session: LiveSession, estado: "CERRADA" | "ERROR", error: string | null) {
  if (session.closed) return
  session.closed = true
  session.meta.estado = estado
  session.meta.error = error
  registry().delete(session.meta.id)

  try {
    session.channel?.end()
  } catch {
    /* la conexión ya estaba caída */
  }
  try {
    session.client.end()
  } catch {
    /* idem */
  }

  for (const listener of session.closeListeners) {
    try {
      listener({ error })
    } catch {
      /* ignorar */
    }
  }
  session.listeners.clear()
  session.closeListeners.clear()

  if (session.onFinalize) {
    const duracion = Math.max(0, Math.round((Date.now() - session.meta.iniciada) / 1000))
    try {
      void Promise.resolve(session.onFinalize({ estado, error, duracion })).catch(() => {})
    } catch {
      /* la auditoría no debe romper el cierre */
    }
  }
}

export function createSshSession(options: SshConnectOptions): Promise<SshSessionMeta> {
  ensureSweeper()

  if (registry().size >= MAX_SESSIONS) {
    return Promise.reject(new ServerError("Se alcanzó el límite de sesiones SSH simultáneas", "MAX_SESSIONS"))
  }
  if (!options.password && !options.privateKey) {
    return Promise.reject(new ServerError("El servidor no tiene contraseña ni clave SSH configurada", "NO_CREDENTIALS"))
  }

  const cols = clampDimension(options.cols, 120, 20, 500)
  const rows = clampDimension(options.rows, 30, 5, 200)

  const session: LiveSession = {
    meta: {
      id: options.sessionId || randomUUID(),
      userId: options.userId,
      serverId: options.serverId,
      serverNombre: options.serverNombre,
      host: options.host,
      port: options.port,
      username: options.username,
      fingerprint: null,
      cols,
      rows,
      iniciada: Date.now(),
      ultimaActividad: Date.now(),
      estado: "ABRIENDO",
      error: null,
    },
    client: new Client(),
    listeners: new Set(),
    closeListeners: new Set(),
    replay: "",
    closed: false,
    mismatch: false,
    onFinalize: options.onFinalize,
  }

  return new Promise<SshSessionMeta>((resolve, reject) => {
    let settled = false
    const fail = (message: string) => {
      if (settled) return
      settled = true
      session.meta.estado = "ERROR"
      session.meta.error = message
      finalize(session, "ERROR", message)
      reject(new ServerError(message, "SSH_ERROR"))
    }

    const timeout = setTimeout(() => {
      fail("La conexión SSH superó el tiempo de espera")
    }, READY_TIMEOUT_MS)
    timeout.unref?.()

    session.client.on("ready", () => {
      session.client.shell(
        { term: "xterm-256color", cols, rows, width: cols * 8, height: rows * 17 },
        (err, channel) => {
          if (err) {
            clearTimeout(timeout)
            fail(err.message || "No se pudo abrir la shell SSH")
            return
          }

          session.channel = channel
          session.meta.estado = "ACTIVA"

          channel.setEncoding("utf8")
          channel.on("data", (data: string | Buffer) => pushOutput(session, data.toString()))
          channel.stderr.on("data", (data: string | Buffer) => pushOutput(session, data.toString()))
          channel.on("close", () => {
            clearTimeout(timeout)
            finalize(session, "CERRADA", null)
          })

          registry().set(session.meta.id, session)

          if (!settled) {
            settled = true
            clearTimeout(timeout)
            resolve({ ...session.meta })
          }
        }
      )
    })

    session.client.on("error", (err: Error & { level?: string }) => {
      clearTimeout(timeout)
      const message = session.mismatch
        ? "La huella del servidor cambió: posible ataque de intermediario. Verificá la nueva huella antes de continuar."
        : err.message || "Error de conexión SSH"
      fail(message)
    })

    session.client.on("close", () => {
      clearTimeout(timeout)
      if (!session.closed) finalize(session, "CERRADA", null)
    })

    try {
      session.client.connect({
        host: options.host,
        port: options.port,
        username: options.username,
        password: options.password || undefined,
        privateKey: options.privateKey || undefined,
        passphrase: options.passphrase || undefined,
        readyTimeout: READY_TIMEOUT_MS,
        keepaliveInterval: 20_000,
        keepaliveCountMax: 3,
        tryKeyboard: Boolean(options.password),
        hostVerifier: (key: Buffer) => {
          const fingerprint = formatSshFingerprint(key)
          session.meta.fingerprint = fingerprint
          if (options.expectedFingerprint && !sshFingerprintMatches(options.expectedFingerprint, fingerprint)) {
            session.mismatch = true
            return false
          }
          return true
        },
      })
    } catch (err) {
      clearTimeout(timeout)
      fail(err instanceof Error ? err.message : "No se pudo iniciar la conexión SSH")
    }
  })
}

export function writeSshSession(id: string, data: string, userId?: string): boolean {
  const session = registry().get(id)
  if (!session || session.closed || !session.channel) return false
  if (userId && session.meta.userId !== userId) return false
  session.meta.ultimaActividad = Date.now()
  session.channel.write(data)
  return true
}

export function resizeSshSession(id: string, cols: number, rows: number, userId?: string): boolean {
  const session = registry().get(id)
  if (!session || session.closed || !session.channel) return false
  if (userId && session.meta.userId !== userId) return false
  const safeCols = clampDimension(cols, session.meta.cols, 20, 500)
  const safeRows = clampDimension(rows, session.meta.rows, 5, 200)
  session.meta.cols = safeCols
  session.meta.rows = safeRows
  session.channel.setWindow(safeRows, safeCols, safeRows * 17, safeCols * 8)
  session.meta.ultimaActividad = Date.now()
  return true
}

export function closeSshSession(id: string, userId?: string, reason?: string): boolean {
  const session = registry().get(id)
  if (!session) return false
  if (userId && session.meta.userId !== userId) return false
  finalize(session, "CERRADA", reason ?? null)
  return true
}

export interface SshSubscription {
  /** Texto acumulado antes de suscribirse, para no perder el banner de bienvenida. */
  replay: string
  unsubscribe: () => void
}

export function subscribeSshSession(
  id: string,
  userId: string | undefined,
  handlers: {
    onData: (chunk: string) => void
    onClose: (info: { error: string | null }) => void
  }
): SshSubscription | null {
  const session = registry().get(id)
  if (!session || session.closed) return null
  if (userId && session.meta.userId !== userId) return null

  session.listeners.add(handlers.onData)
  session.closeListeners.add(handlers.onClose)

  return {
    replay: session.replay,
    unsubscribe: () => {
      session.listeners.delete(handlers.onData)
      session.closeListeners.delete(handlers.onClose)
    },
  }
}

/** Cierra todas las sesiones (usado en tests y al apagar el proceso). */
export function closeAllSshSessions(): void {
  for (const session of Array.from(registry().values())) {
    finalize(session, "CERRADA", "Sesión finalizada")
  }
}
