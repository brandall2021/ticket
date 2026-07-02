import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    return { session: null, error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) }
  }
  return { session, error: null }
}

export async function requireRole(roles: string[]) {
  const result = await requireAuth()
  if (result.error) return result

  if (!roles.includes(result.session!.user.role)) {
    return { session: null, error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) }
  }
  return result
}
