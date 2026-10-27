import test from "node:test"
import assert from "node:assert/strict"

import { isIpLiteral, isIpv4, isIpv6 } from "../src/lib/ip"
import { safeHref, safeHttpUrl } from "../src/lib/url"
import { escapeHtml } from "../src/lib/email"
import { consume, clientIp } from "../src/lib/rate-limit"
import { isSafeHttpUrl, passwordSchema } from "../src/lib/schemas"

test("acepta solo IPs literales y rechaza intentos de inyección", () => {
  assert.equal(isIpLiteral("192.168.0.1"), true)
  assert.equal(isIpLiteral(" 10.0.0.5 "), true)
  assert.equal(isIpLiteral("::1"), true)
  assert.equal(isIpLiteral("2001:db8::1"), true)
  assert.equal(isIpLiteral("fe80::1%eth0"), true)

  // Vectores clásicos de inyección de comandos.
  assert.equal(isIpLiteral("127.0.0.1; id"), false)
  assert.equal(isIpLiteral("127.0.0.1 && curl evil"), false)
  assert.equal(isIpLiteral("$(whoami)"), false)
  assert.equal(isIpLiteral("`id`"), false)
  assert.equal(isIpLiteral("8.8.8.8 | tee /tmp/x"), false)
  assert.equal(isIpLiteral("example.com"), false)
  assert.equal(isIpLiteral(""), false)
  assert.equal(isIpLiteral(null), false)

  // IPv4 inválidas
  assert.equal(isIpv4("256.1.1.1"), false)
  assert.equal(isIpv4("1.2.3"), false)
  assert.equal(isIpv4("01.2.3.4"), false)
  assert.equal(isIpv4("1.2.3.4.5"), false)
})

test("valida IPv6 de forma conservadora", () => {
  assert.equal(isIpv6("::1"), true)
  assert.equal(isIpv6("2001:0db8:0000:0000:0000:0000:0000:0001"), true)
  assert.equal(isIpv6("gggg::1"), false)
  assert.equal(isIpv6("1.2.3.4"), false)
})

test("bloquea URLs peligrosas al renderizar enlaces", () => {
  assert.equal(safeHttpUrl("https://ejemplo.com"), "https://ejemplo.com")
  assert.equal(safeHttpUrl("http://192.168.0.1:8080/admin"), "http://192.168.0.1:8080/admin")

  assert.equal(safeHttpUrl("javascript:alert(1)"), null)
  assert.equal(safeHttpUrl("JavaScript:alert(1)"), null)
  assert.equal(safeHttpUrl("data:text/html;base64,PHNjcmlwdD4="), null)
  assert.equal(safeHttpUrl("vbscript:msgbox(1)"), null)
  assert.equal(safeHttpUrl("/ruta-relativa"), null)
  assert.equal(safeHttpUrl(""), null)
  assert.equal(safeHttpUrl(null), null)

  assert.equal(safeHref("javascript:alert(1)"), "#")
  assert.equal(safeHref("https://ok.test"), "https://ok.test")
})

test("el esquema de URLs sólo permite http(s)", () => {
  assert.equal(isSafeHttpUrl("https://a.test/x"), true)
  assert.equal(isSafeHttpUrl("javascript:alert(1)"), false)
  assert.equal(isSafeHttpUrl("ftp://a.test"), false)
})

test("escapa HTML en los correos", () => {
  assert.equal(escapeHtml('<script>alert("x")</script>'),
    "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;")
  assert.equal(escapeHtml("Tom & Jerry"), "Tom &amp; Jerry")
  assert.equal(escapeHtml("O'Brien"), "O&#39;Brien")
  assert.equal(escapeHtml(null), "")
  assert.equal(escapeHtml(undefined), "")
  assert.equal(
    escapeHtml('<a href="https://malo">Ver</a>'),
    "&lt;a href=&quot;https://malo&quot;&gt;Ver&lt;/a&gt;"
  )
})

test("la política de contraseñas exige 10 caracteres y 72 bytes", () => {
  assert.equal(passwordSchema.safeParse("corta").success, false)
  assert.equal(passwordSchema.safeParse("123456789").success, false)
  assert.equal(passwordSchema.safeParse("1234567890").success, true)
  assert.equal(passwordSchema.safeParse("a".repeat(72)).success, true)
  assert.equal(passwordSchema.safeParse("a".repeat(73)).success, false)
  // Multibyte: "á" ocupa 2 bytes en UTF-8, así que 37 caracteres superan 72.
  assert.equal(passwordSchema.safeParse("á".repeat(37)).success, false)
})

test("el limitador bloquea al superar el cupo y se reinicia", () => {
  const key = `test:${Math.random()}`
  assert.equal(consume(key, 2, 1000, 0).ok, true)
  assert.equal(consume(key, 2, 1000, 10).ok, true)
  const blocked = consume(key, 2, 1000, 20)
  assert.equal(blocked.ok, false)
  assert.ok(blocked.retryAfterSeconds > 0)
  // Pasada la ventana vuelve a permitir.
  assert.equal(consume(key, 2, 1000, 1100).ok, true)
})

test("el limitador separa claves distintas", () => {
  const a = `a:${Math.random()}`
  const b = `b:${Math.random()}`
  consume(a, 1, 1000, 0)
  assert.equal(consume(a, 1, 1000, 1).ok, false)
  assert.equal(consume(b, 1, 1000, 1).ok, true)
})

test("clientIp prioriza x-forwarded-for", () => {
  const req = (headers: Record<string, string>) =>
    new Request("http://localhost/api", { headers })
  assert.equal(clientIp(req({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" })), "1.2.3.4")
  assert.equal(clientIp(req({ "x-real-ip": "9.9.9.9" })), "9.9.9.9")
  assert.equal(clientIp(req({})), "desconocida")
})
