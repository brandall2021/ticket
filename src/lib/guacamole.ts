import { randomUUID } from "node:crypto"
import {
  buildGuacamoleTunnelUrl,
  buildRdpConnectionParameters,
  getGuacamoleConfig,
  ServerError,
  type GuacamoleConfig,
  type ServerLike,
} from "./servers"

const REQUEST_TIMEOUT_MS = 12_000
/** Las conexiones efímeras se limpian solas si nadie las borra. */
const CONNECTION_TTL_MS = 8 * 60 * 60 * 1000

interface EphemeralConnection {
  connectionId: string
  token: string
  dataSource: string
  createdAt: number
}

const STORE_KEY = "__helpdeskGuacamoleConnections"

function store(): Map<string, EphemeralConnection> {
  const holder = globalThis as unknown as Record<string, Map<string, EphemeralConnection> | undefined>
  let connections = holder[STORE_KEY]
  if (!connections) {
    connections = new Map<string, EphemeralConnection>()
    holder[STORE_KEY] = connections
  }
  return connections
}

async function guacamoleFetch(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: "no-store" })
  } catch (err) {
    const reason = err instanceof Error && err.name === "AbortError" ? "tiempo de espera agotado" : String(err)
    throw new ServerError(`No se pudo contactar el gateway Guacamole (${reason})`, "GUACAMOLE_UNREACHABLE")
  } finally {
    clearTimeout(timer)
  }
}

async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string }
    return data.message || `HTTP ${response.status}`
  } catch {
    return `HTTP ${response.status}`
  }
}

export async function createGuacamoleToken(config: GuacamoleConfig): Promise<string> {
  const body = new URLSearchParams({ username: config.user, password: config.password })
  const response = await guacamoleFetch(`${config.apiUrl}/api/tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  })
  if (!response.ok) {
    throw new ServerError(`Guacamole rechazó las credenciales: ${await readError(response)}`, "GUACAMOLE_AUTH")
  }
  const data = (await response.json()) as { authToken?: string }
  if (!data.authToken) {
    throw new ServerError("Guacamole no devolvió un token de sesión", "GUACAMOLE_AUTH")
  }
  return data.authToken
}

export interface GuacamoleSession {
  /** URL `wss://…/websocket-tunnel` lista para `Guacamole.WebSocketTunnel`. */
  tunnelUrl: string
  connectionId: string
  /** true si se reutilizó un gateway existente; false si no hay Guacamole configurado. */
  available: boolean
}

/**
 * Crea una conexión RDP efímera en Guacamole y devuelve la URL del túnel.
 * Lanza `ServerError` con código `GUACAMOLE_DISABLED` si no está configurado.
 */
export async function createRdpTunnel(
  server: ServerLike,
  options: { password?: string | null; width?: number; height?: number } = {}
): Promise<GuacamoleSession> {
  const config = getGuacamoleConfig()
  if (!config) {
    throw new ServerError("Guacamole no está configurado", "GUACAMOLE_DISABLED")
  }

  const token = await createGuacamoleToken(config)
  const parameters = buildRdpConnectionParameters(server, options.password)
  const payload = {
    parentIdentifier: "ROOT",
    name: `helpdesk-${server.nombre}-${randomUUID().slice(0, 8)}`.slice(0, 120),
    protocol: "rdp",
    parameters,
  }

  const url = `${config.apiUrl}/api/session/data/${encodeURIComponent(config.dataSource)}/connections?token=${encodeURIComponent(token)}`
  const response = await guacamoleFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new ServerError(`Guacamole no pudo crear la conexión: ${await readError(response)}`, "GUACAMOLE_ERROR")
  }

  const connection = (await response.json()) as { identifier?: string }
  if (!connection.identifier) {
    throw new ServerError("Guacamole no devolvió el identificador de la conexión", "GUACAMOLE_ERROR")
  }

  store().set(connection.identifier, {
    connectionId: connection.identifier,
    token,
    dataSource: config.dataSource,
    createdAt: Date.now(),
  })
  sweepConnections()

  const width = options.width ?? (Number.parseInt(parameters.width, 10) || 1280)
  const height = options.height ?? (Number.parseInt(parameters.height, 10) || 800)

  return {
    tunnelUrl: buildGuacamoleTunnelUrl(config, token, connection.identifier, { width, height }),
    connectionId: connection.identifier,
    available: true,
  }
}

export async function deleteRdpTunnel(connectionId: string): Promise<boolean> {
  const config = getGuacamoleConfig()
  const entry = store().get(connectionId)
  if (!config || !entry) return false

  const url = `${config.apiUrl}/api/session/data/${encodeURIComponent(entry.dataSource)}/connections/${encodeURIComponent(connectionId)}?token=${encodeURIComponent(entry.token)}`
  try {
    const response = await guacamoleFetch(url, { method: "DELETE" })
    store().delete(connectionId)
    return response.ok
  } catch {
    store().delete(connectionId)
    return false
  }
}

function sweepConnections() {
  const now = Date.now()
  for (const [id, entry] of store()) {
    if (now - entry.createdAt > CONNECTION_TTL_MS) {
      store().delete(id)
    }
  }
}

export function getGuacamoleStatus(): { configured: boolean; apiUrl: string | null } {
  const config = getGuacamoleConfig()
  return { configured: Boolean(config), apiUrl: config?.apiUrl ?? null }
}
