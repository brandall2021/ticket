import { type NextRequest } from "next/server"
import { handlers } from "@/lib/auth"
import { clientIp, consume, rateLimitResponse } from "@/lib/rate-limit"

export const GET = handlers.GET

/** 10 intentos de login por IP cada 15 minutos. */
const LOGIN_LIMIT = 10
const LOGIN_WINDOW_MS = 15 * 60 * 1000

export async function POST(req: NextRequest) {
  const pathname = new URL(req.url).pathname

  if (pathname.endsWith("/callback/credentials")) {
    const result = consume(`login:${clientIp(req)}`, LOGIN_LIMIT, LOGIN_WINDOW_MS)
    if (!result.ok) {
      return rateLimitResponse(result, "Demasiados intentos de inicio de sesión. Probá más tarde.")
    }
  }

  return handlers.POST(req)
}
