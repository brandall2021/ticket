/**
 * Devuelve la URL sólo si es http(s) absoluta. Se usa como segunda barrera al
 * renderizar enlaces guardados en la base (el primero es el esquema Zod de las
 * rutas de escritura): evita `javascript:`, `data:` y `vbscript:`.
 */
export function safeHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    return value
  } catch {
    return null
  }
}

/** Igual que `safeHttpUrl` pero devuelve "#" para poder usarlo directo en un href. */
export function safeHref(value: string | null | undefined): string {
  return safeHttpUrl(value) ?? "#"
}
