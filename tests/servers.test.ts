import test from "node:test"
import assert from "node:assert/strict"

import {
  buildGuacamoleTunnelUrl,
  buildRdpConnectionParameters,
  buildRdpFileContent,
  decryptServerSecret,
  defaultPort,
  encryptServerSecret,
  formatSshFingerprint,
  getGuacamoleConfig,
  hasServerEncryptionKey,
  isEncryptedServerSecret,
  normalizeProtocol,
  rdpFileName,
  resolvePort,
  resolveResolution,
  resolveSecurity,
  sanitizeServer,
  sshFingerprintMatches,
  type GuacamoleConfig,
} from "../src/lib/servers"

// Claves de prueba: se generan para no dejar literales que parezcan secretos reales.
const KEY = "k".repeat(40)
const OTHER_KEY = "o".repeat(40)

function withKey<T>(value: string | undefined, fn: () => T): T {
  const previousServer = process.env.SERVER_ENCRYPTION_KEY
  const previousMikrotik = process.env.MIKROTIK_ENCRYPTION_KEY
  try {
    if (value === undefined) delete process.env.SERVER_ENCRYPTION_KEY
    else process.env.SERVER_ENCRYPTION_KEY = value
    delete process.env.MIKROTIK_ENCRYPTION_KEY
    return fn()
  } finally {
    if (previousServer === undefined) delete process.env.SERVER_ENCRYPTION_KEY
    else process.env.SERVER_ENCRYPTION_KEY = previousServer
    if (previousMikrotik === undefined) delete process.env.MIKROTIK_ENCRYPTION_KEY
    else process.env.MIKROTIK_ENCRYPTION_KEY = previousMikrotik
  }
}

test("cifra y descifra las credenciales de un servidor", () => {
  withKey(KEY, () => {
    const encrypted = encryptServerSecret("credencial-de-prueba")
    assert.equal(isEncryptedServerSecret(encrypted), true)
    assert.notEqual(encrypted, "credencial-de-prueba")
    assert.equal(decryptServerSecret(encrypted), "credencial-de-prueba")
    // Volver a cifrar un valor ya cifrado no lo altera.
    assert.equal(encryptServerSecret(encrypted), encrypted)
  })
})

test("rechaza credenciales cifradas con otra clave", () => {
  let encrypted = ""
  withKey(KEY, () => {
    encrypted = encryptServerSecret("otra-credencial-de-prueba")
  })
  withKey(OTHER_KEY, () => {
    assert.throws(() => decryptServerSecret(encrypted), /descifrar/)
  })
})

test("usa MIKROTIK_ENCRYPTION_KEY como respaldo", () => {
  const previousServer = process.env.SERVER_ENCRYPTION_KEY
  const previousMikrotik = process.env.MIKROTIK_ENCRYPTION_KEY
  try {
    delete process.env.SERVER_ENCRYPTION_KEY
    process.env.MIKROTIK_ENCRYPTION_KEY = KEY
    assert.equal(hasServerEncryptionKey(), true)
    assert.equal(decryptServerSecret(encryptServerSecret("x")), "x")
  } finally {
    if (previousServer === undefined) delete process.env.SERVER_ENCRYPTION_KEY
    else process.env.SERVER_ENCRYPTION_KEY = previousServer
    if (previousMikrotik === undefined) delete process.env.MIKROTIK_ENCRYPTION_KEY
    else process.env.MIKROTIK_ENCRYPTION_KEY = previousMikrotik
  }
})

test("detecta la ausencia de clave de cifrado", () => {
  withKey(undefined, () => {
    assert.equal(hasServerEncryptionKey(), false)
    assert.throws(() => encryptServerSecret("x"), /SERVER_ENCRYPTION_KEY/)
  })
  withKey("corta", () => {
    assert.equal(hasServerEncryptionKey(), false)
  })
})

test("normaliza el protocolo y los puertos por defecto", () => {
  assert.equal(normalizeProtocol(" ssh "), "SSH")
  assert.equal(normalizeProtocol("RDP"), "RDP")
  assert.equal(normalizeProtocol("telnet"), null)
  assert.equal(defaultPort("SSH"), 22)
  assert.equal(defaultPort("RDP"), 3389)
  assert.equal(defaultPort("desconocido"), 22)
})

test("resuelve el puerto con validación", () => {
  assert.equal(resolvePort("RDP", 3390), 3390)
  assert.equal(resolvePort("RDP", "3390"), 3390)
  assert.equal(resolvePort("RDP", undefined), 3389)
  assert.equal(resolvePort("SSH", 0), 22)
  assert.equal(resolvePort("SSH", 70000), 22)
  assert.equal(resolvePort("SSH", 22.5), 22)
})

test("valida la resolución de pantalla", () => {
  assert.deepEqual(resolveResolution("1920x1080"), { width: 1920, height: 1080 })
  assert.deepEqual(resolveResolution("1024×768"), { width: 1024, height: 768 })
  assert.deepEqual(resolveResolution("basura"), { width: 1280, height: 800 })
  assert.deepEqual(resolveResolution(undefined), { width: 1280, height: 800 })
  assert.deepEqual(resolveResolution("100x100"), { width: 1280, height: 800 })
})

test("valida el modo de seguridad de RDP", () => {
  assert.equal(resolveSecurity("nla"), "nla")
  assert.equal(resolveSecurity("tls"), "tls")
  assert.equal(resolveSecurity("otro"), "any")
  assert.equal(resolveSecurity(null), "any")
})

test("genera huellas SSH en formato OpenSSH", () => {
  const fingerprint = formatSshFingerprint(Buffer.from("host-key"))
  assert.match(fingerprint, /^SHA256:[A-Za-z0-9+/]+$/)
  assert.equal(fingerprint.endsWith("="), false)
  assert.equal(formatSshFingerprint(Buffer.from("host-key")), fingerprint)
  assert.equal(sshFingerprintMatches(fingerprint, fingerprint), true)
  assert.equal(sshFingerprintMatches(fingerprint, formatSshFingerprint(Buffer.from("otra"))), false)
  assert.equal(sshFingerprintMatches(fingerprint, "SHA256:corto"), false)
})

const SERVER = {
  nombre: "Servidor de archivos",
  host: "192.168.10.20",
  protocolo: "RDP",
  puerto: 3389,
  usuario: "administrador",
  dominio: "EMPRESA",
  resolucion: "1600x900",
  seguridad: "nla",
}

test("arma los parámetros RDP para Guacamole", () => {
  const params = buildRdpConnectionParameters(SERVER, "clave-rdp")
  assert.equal(params.hostname, "192.168.10.20")
  assert.equal(params.port, "3389")
  assert.equal(params.username, "administrador")
  assert.equal(params.domain, "EMPRESA")
  assert.equal(params.password, "clave-rdp")
  assert.equal(params.security, "nla")
  assert.equal(params.width, "1600")
  assert.equal(params.height, "900")
  assert.equal(params["ignore-cert"], "true")

  const withoutPassword = buildRdpConnectionParameters(SERVER)
  assert.equal("password" in withoutPassword, false)
})

test("genera el contenido de un archivo .rdp", () => {
  const content = buildRdpFileContent(SERVER)
  assert.match(content, /full address:s:192\.168\.10\.20:3389/)
  assert.match(content, /username:s:administrador/)
  assert.match(content, /domain:s:EMPRESA/)
  assert.match(content, /desktopwidth:i:1600/)
  assert.match(content, /desktopheight:i:900/)
  assert.ok(content.endsWith("\r\n"))
})

test("normaliza el nombre del archivo .rdp", () => {
  assert.equal(rdpFileName("Servidor de Archivos N°1"), "servidor-de-archivos-n1.rdp")
  assert.equal(rdpFileName("ÁÉÍÓÚ"), "aeiou.rdp")
  assert.equal(rdpFileName("///"), "servidor.rdp")
})

test("quita las credenciales al serializar un servidor", () => {
  const safe = sanitizeServer({
    id: "abc",
    nombre: "srv",
    password: "enc:v1:aaaa.bbbb.cccc",
    privateKey: null,
    passphrase: "enc:v1:dddd.eeee.ffff",
  })
  assert.equal("password" in safe, false)
  assert.equal("privateKey" in safe, false)
  assert.equal("passphrase" in safe, false)
  assert.equal(safe.tienePassword, true)
  assert.equal(safe.tieneClavePrivada, false)
  assert.equal(safe.id, "abc")
})

test("lee la configuración de Guacamole desde el entorno", () => {
  assert.equal(getGuacamoleConfig({}), null)
  assert.equal(
    getGuacamoleConfig({ GUACAMOLE_URL: "http://guacamole:8080/guacamole" }),
    null,
    "sin usuario y contraseña no está configurado"
  )

  const config = getGuacamoleConfig({
    GUACAMOLE_URL: "http://guacamole:8080/guacamole/",
    GUACAMOLE_PUBLIC_URL: "https://helpdesk.local/guacamole/",
    GUACAMOLE_USER: "guacadmin",
    GUACAMOLE_PASSWORD: "secreto",
  })
  assert.ok(config)
  assert.equal(config!.apiUrl, "http://guacamole:8080/guacamole")
  assert.equal(config!.publicUrl, "https://helpdesk.local/guacamole")
  assert.equal(config!.dataSource, "default")
})

test("construye la URL del túnel WebSocket de Guacamole", () => {
  const config: GuacamoleConfig = {
    apiUrl: "http://guacamole:8080/guacamole",
    publicUrl: "/guacamole",
    user: "guacadmin",
    password: "secreto",
    dataSource: "default",
  }
  const url = buildGuacamoleTunnelUrl(config, "tok en", "conexión-1", { width: 1280, height: 800 })
  assert.ok(url.startsWith("/guacamole/websocket-tunnel?"))
  assert.match(url, /token=tok\+en/)
  assert.match(url, /GUAC_ID=conexi/)
  assert.match(url, /GUAC_WIDTH=1280/)
  assert.match(url, /GUAC_HEIGHT=800/)
  assert.match(url, /GUAC_DATA_SOURCE=default/)
  assert.match(url, /GUAC_TYPE=c/)
})
