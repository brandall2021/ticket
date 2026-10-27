/**
 * Validación de IPs sin dependencias de Node, para poder usarla tanto en
 * el servidor como en esquemas Zod compartidos.
 */

export function isIpv4(value: string): boolean {
  const parts = value.trim().split(".")
  if (parts.length !== 4) return false
  return parts.every(part => {
    if (!/^\d{1,3}$/.test(part)) return false
    // Rechaza ceros a la izquierda ("010") y valores fuera de rango.
    if (part.length > 1 && part.startsWith("0")) return false
    return Number(part) <= 255
  })
}

export function isIpv6(value: string): boolean {
  const withoutZone = value.trim().split("%")[0]
  if (!withoutZone.includes(":")) return false
  if (!/^[0-9a-fA-F:]+$/.test(withoutZone)) return false
  // Al menos tres grupos separados por ":" (cubre "::1" y formas completas).
  return withoutZone.split(":").length >= 3
}

/** true si el valor es una IPv4 o IPv6 literal (sin nombres de host). */
export function isIpLiteral(value: unknown): value is string {
  if (typeof value !== "string") return false
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > 45) return false
  return isIpv4(trimmed) || isIpv6(trimmed)
}
