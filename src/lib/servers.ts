import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto"

export type ServerProtocol = "SSH" | "RDP"

export const SERVER_PROTOCOLS: ServerProtocol[] = ["SSH", "RDP"]

export const DEFAULT_PORTS: Record<ServerProtocol, number> = {
  SSH: 22,
  RDP: 3389,
}

/** Ancho/alto por defecto cuando la resolución guardada no es válida. */
export const DEFAULT_RESOLUTION = { width: 1280, height: 800 }

/** Valores aceptados por Guacamole en el parámetro `security` para RDP. */
export const RDP_SECURITY_OPTIONS = ["any", "nla", "tls", "rdp"] as const
export type RdpSecurity = (typeof RDP_SECURITY_OPTIONS)[number]

const SECRET_PREFIX = "enc:v1:"

export class ServerError extends Error {
  constructor(message: string, readonly code?: string) {
    super(message)
    this.name = "ServerError"
  }
}

export function normalizeProtocol(value: unknown): ServerProtocol | null {
  if (typeof value !== "string") return null
  const normalized = value.trim().toUpperCase()
  return normalized === "SSH" || normalized === "RDP" ? normalized : null
}

export function defaultPort(protocolo: string): number {
  const protocol = normalizeProtocol(protocolo)
  return protocol ? DEFAULT_PORTS[protocol] : DEFAULT_PORTS.SSH
}

/** Devuelve el puerto recibido si es válido, o el puerto por defecto del protocolo. */
export function resolvePort(protocolo: string, value: unknown): number {
  const port = typeof value === "string" ? Number.parseInt(value, 10) : value
  if (typeof port === "number" && Number.isInteger(port) && port >= 1 && port <= 65535) {
    return port
  }
  return defaultPort(protocolo)
}

export function resolveResolution(value: unknown): { width: number; height: number } {
  if (typeof value !== "string") return { ...DEFAULT_RESOLUTION }
  const match = /^\s*(\d{3,5})\s*[x×]\s*(\d{3,5})\s*$/.exec(value)
  if (!match) return { ...DEFAULT_RESOLUTION }
  const width = Number.parseInt(match[1], 10)
  const height = Number.parseInt(match[2], 10)
  if (width < 640 || width > 7680 || height < 480 || height > 4320) {
    return { ...DEFAULT_RESOLUTION }
  }
  return { width, height }
}

export function resolveSecurity(value: unknown): RdpSecurity {
  if (typeof value === "string" && (RDP_SECURITY_OPTIONS as readonly string[]).includes(value)) {
    return value as RdpSecurity
  }
  return "any"
}

// ---------------------------------------------------------------------------
// Cifrado de credenciales
// ---------------------------------------------------------------------------

function getEncryptionSecret(): string {
  const secret = process.env.SERVER_ENCRYPTION_KEY || process.env.MIKROTIK_ENCRYPTION_KEY
  if (!secret || secret.length < 32) {
    throw new ServerError(
      "SERVER_ENCRYPTION_KEY debe tener al menos 32 caracteres (o reutilizá MIKROTIK_ENCRYPTION_KEY)",
      "NO_KEY"
    )
  }
  return secret
}

function getEncryptionKey(): Buffer {
  return createHash("sha256").update(getEncryptionSecret()).digest()
}

export function hasServerEncryptionKey(): boolean {
  const secret = process.env.SERVER_ENCRYPTION_KEY || process.env.MIKROTIK_ENCRYPTION_KEY
  return Boolean(secret && secret.length >= 32)
}

export function isEncryptedServerSecret(value: string): boolean {
  return value.startsWith(SECRET_PREFIX)
}

export function encryptServerSecret(value: string): string {
  if (isEncryptedServerSecret(value)) return value
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${SECRET_PREFIX}${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`
}

export function decryptServerSecret(value: string): string {
  if (!isEncryptedServerSecret(value)) return value
  const [ivValue, tagValue, encryptedValue] = value.slice(SECRET_PREFIX.length).split(".")
  if (!ivValue || !tagValue || encryptedValue === undefined) {
    throw new ServerError("Credencial del servidor cifrada inválida")
  }
  try {
    const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(ivValue, "base64url"))
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"))
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, "base64url")),
      decipher.final(),
    ]).toString("utf8")
  } catch {
    throw new ServerError("No se pudo descifrar la credencial del servidor")
  }
}

/** Igual que `encryptServerSecret` pero devuelve `undefined` para valores vacíos. */
export function encryptOptional(value: string | null | undefined): string | undefined {
  if (value === null || value === undefined || value === "") return undefined
  return encryptServerSecret(value)
}

// ---------------------------------------------------------------------------
// Huella de host SSH (TOFU)
// ---------------------------------------------------------------------------

/** Formato OpenSSH: `SHA256:<base64 sin relleno>` */
export function formatSshFingerprint(publicKeyBlob: Buffer): string {
  const digest = createHash("sha256").update(publicKeyBlob).digest("base64").replace(/=+$/, "")
  return `SHA256:${digest}`
}

export function sshFingerprintMatches(expected: string, actual: string): boolean {
  const left = Buffer.from(expected.trim())
  const right = Buffer.from(actual.trim())
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

// ---------------------------------------------------------------------------
// Guacamole (RDP en el navegador)
// ---------------------------------------------------------------------------

export interface GuacamoleConfig {
  /** URL interna para la API REST, ej. http://guacamole:8080/guacamole */
  apiUrl: string
  /** URL que ve el navegador, ej. https://helpdesk.local/guacamole */
  publicUrl: string
  user: string
  password: string
  dataSource: string
}

export function getGuacamoleConfig(
  env: Record<string, string | undefined> = process.env
): GuacamoleConfig | null {
  const apiUrl = env.GUACAMOLE_URL?.trim()
  if (!apiUrl) return null
  const user = env.GUACAMOLE_USER?.trim()
  const password = env.GUACAMOLE_PASSWORD
  if (!user || !password) return null
  // Por defecto se asume la ruta publicada por el nginx del repo.
  const publicUrl = (env.GUACAMOLE_PUBLIC_URL?.trim() || "/guacamole").replace(/\/+$/, "")
  return {
    apiUrl: apiUrl.replace(/\/+$/, ""),
    publicUrl,
    user,
    password,
    dataSource: env.GUACAMOLE_DATA_SOURCE?.trim() || "default",
  }
}

export function isGuacamoleConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return getGuacamoleConfig(env) !== null
}

export interface ServerLike {
  nombre: string
  host: string
  protocolo: string
  puerto: number
  usuario: string
  password?: string | null
  dominio?: string | null
  resolucion?: string | null
  seguridad?: string | null
}

/**
 * Parámetros del protocolo RDP que se envían a Guacamole al crear la conexión.
 * `password` sólo se incluye si se pasa explícitamente (credencial descifrada).
 */
export function buildRdpConnectionParameters(
  server: ServerLike,
  password?: string | null
): Record<string, string> {
  const { width, height } = resolveResolution(server.resolucion)
  const params: Record<string, string> = {
    hostname: server.host,
    port: String(server.puerto || DEFAULT_PORTS.RDP),
    username: server.usuario,
    width: String(width),
    height: String(height),
    dpi: "96",
    "ignore-cert": "true",
    security: resolveSecurity(server.seguridad),
    "resize-method": "display-update",
    "enable-font-smoothing": "true",
    "color-depth": "32",
    "server-layout": "es-es-qwerty",
    "disable-copy": "false",
    "disable-paste": "false",
  }
  if (server.dominio) params.domain = server.dominio
  if (password) params.password = password
  return params
}

export function buildGuacamoleTunnelUrl(
  config: GuacamoleConfig,
  token: string,
  connectionId: string,
  options: { width: number; height: number; dpi?: number }
): string {
  const base = config.publicUrl.replace(/^http/, "ws")
  const query = new URLSearchParams({
    token,
    GUAC_DATA_SOURCE: config.dataSource,
    GUAC_ID: connectionId,
    GUAC_TYPE: "c",
    GUAC_WIDTH: String(options.width),
    GUAC_HEIGHT: String(options.height),
    GUAC_DPI: String(options.dpi ?? 96),
  })
  return `${base}/websocket-tunnel?${query.toString()}`
}

// ---------------------------------------------------------------------------
// Archivo .rdp (alternativa sin Guacamole)
// ---------------------------------------------------------------------------

/** Contenido de un archivo .rdp para abrir mstsc en la máquina del agente. */
export function buildRdpFileContent(server: ServerLike): string {
  const { width, height } = resolveResolution(server.resolucion)
  const lines = [
    "screen mode id:i:2",
    `desktopwidth:i:${width}`,
    `desktopheight:i:${height}`,
    "session bpp:i:32",
    `full address:s:${server.host}:${server.puerto || DEFAULT_PORTS.RDP}`,
    `username:s:${server.usuario}`,
    `domain:s:${server.dominio || ""}`,
    "prompt for credentials:i:1",
    "promptcredentialonce:i:0",
    "authentication level:i:0",
    "enablecredsspsupport:i:1",
    "redirectclipboard:i:1",
    "audiomode:i:0",
    "administrative session:i:0",
    "bitmapcachepersistenable:i:1",
    "autoreconnection enabled:i:1",
  ]
  return lines.join("\r\n") + "\r\n"
}

/** Nombre de archivo seguro para descargar el .rdp */
export function rdpFileName(nombre: string): string {
  const safe = nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase()
  return `${safe || "servidor"}.rdp`
}

// ---------------------------------------------------------------------------
// Serialización segura hacia el cliente
// ---------------------------------------------------------------------------

export interface ServerSecrets {
  password?: string | null
  privateKey?: string | null
  passphrase?: string | null
}

/** Quita las credenciales cifradas y expone sólo indicadores booleanos. */
export function sanitizeServer<T extends ServerSecrets>(server: T): Omit<T, keyof ServerSecrets> & {
  tienePassword: boolean
  tieneClavePrivada: boolean
} {
  const { password, privateKey, passphrase, ...safe } = server
  void passphrase
  return {
    ...safe,
    tienePassword: Boolean(password),
    tieneClavePrivada: Boolean(privateKey),
  }
}
