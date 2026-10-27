/**
 * Limitador de peticiones en memoria (ventana fija por clave).
 *
 * Suficiente para un despliegue de un solo proceso: frena fuerza bruta y
 * bombardeo de correos. Si se escala horizontalmente, reemplazar por Redis.
 */

interface Bucket {
  count: number
  resetAt: number
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  retryAfterSeconds: number
}

const STORE_KEY = "__helpdeskRateLimits"
const MAX_ENTRIES = 10_000

function store(): Map<string, Bucket> {
  const holder = globalThis as unknown as Record<string, Map<string, Bucket> | undefined>
  let buckets = holder[STORE_KEY]
  if (!buckets) {
    buckets = new Map<string, Bucket>()
    holder[STORE_KEY] = buckets
  }
  return buckets
}

/** Registra un intento y devuelve si está permitido. */
export function consume(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  const buckets = store()

  if (buckets.size > MAX_ENTRIES) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey)
    }
  }

  const current = buckets.get(key)
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: Math.max(0, limit - 1), retryAfterSeconds: 0 }
  }

  current.count += 1
  if (current.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    }
  }
  return { ok: true, remaining: Math.max(0, limit - current.count), retryAfterSeconds: 0 }
}

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]?.trim() || "desconocida"
  return req.headers.get("x-real-ip") || req.headers.get("cf-connecting-ip") || "desconocida"
}

/** Respuesta 429 estándar con `Retry-After`. */
export function rateLimitResponse(result: RateLimitResult, message = "Demasiados intentos. Esperá unos minutos."): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(result.retryAfterSeconds),
    },
  })
}
