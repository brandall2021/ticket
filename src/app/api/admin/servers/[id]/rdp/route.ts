import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN } from "@/lib/constants"
import { logAudit } from "@/lib/audit"
import { buildRdpFileContent, rdpFileName } from "@/lib/servers"

type Params = { params: Promise<{ id: string }> }

export const dynamic = "force-dynamic"

/** Descarga un archivo .rdp para abrir la sesión con mstsc (sin Guacamole). */
export async function GET(_req: NextRequest, { params }: Params) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const { id } = await params
  const server = await prisma.server.findUnique({ where: { id } })
  if (!server) return NextResponse.json({ error: "Servidor no encontrado" }, { status: 404 })
  if (server.protocolo !== "RDP") {
    return NextResponse.json({ error: "El servidor no es RDP" }, { status: 400 })
  }

  const content = buildRdpFileContent(server)
  await logAudit(authResult.session!.user.id, "DESCARGAR_RDP", `${server.nombre} (${server.host})`)

  return new Response(content, {
    headers: {
      "Content-Type": "application/x-rdp; charset=utf-8",
      "Content-Disposition": `attachment; filename="${rdpFileName(server.nombre)}"`,
      "Cache-Control": "no-store",
    },
  })
}
