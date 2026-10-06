import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN } from "@/lib/constants"
import { resolveSection, mikrotikConfigFromRouter } from "@/lib/mikrotik"

const SECTIONS = ["interfaces", "dhcp", "arp", "firewall", "nat", "routes", "logs", "snapshots", "traffic"] as const
type Section = (typeof SECTIONS)[number]

function esc(v: unknown): string {
  if (v === null || v === undefined) return ""
  const s = String(v)
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function csv(rows: Array<Array<unknown>>): string {
  return rows.map(r => r.map(esc).join(",")).join("\n")
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const { id } = await params
  const section = (req.nextUrl.searchParams.get("section") || "interfaces") as Section
  const hours = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get("hours") || "24", 10), 1), 168)

  if (!SECTIONS.includes(section)) {
    return NextResponse.json({ error: "Sección inválida" }, { status: 400 })
  }

  const router = await prisma.mikrotikRouter.findUnique({ where: { id } })
  if (!router) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  const since = new Date(Date.now() - hours * 3600 * 1000)
  let content = ""
  const filename = `mikrotik-${router.nombre.replace(/\s+/g, "-").toLowerCase()}-${section}-${new Date().toISOString().slice(0, 10)}.csv`

  switch (section) {
    case "snapshots": {
      const rows = await prisma.mikrotikSnapshot.findMany({
        where: { routerId: id, createdAt: { gte: since } },
        orderBy: { createdAt: "asc" },
      })
      content = csv([
        ["Fecha", "CPU %", "Memoria libre (MB)", "Memoria total (MB)", "Uptime (seg)"],
        ...rows.map(r => [
          r.createdAt.toISOString(),
          r.cpuLoad ?? "",
          r.freeMemory !== null && r.freeMemory !== undefined ? (r.freeMemory / 1024 / 1024).toFixed(1) : "",
          r.totalMemory !== null && r.totalMemory !== undefined ? (r.totalMemory / 1024 / 1024).toFixed(1) : "",
          r.uptimeSec ?? "",
        ]),
      ])
      break
    }
    case "traffic": {
      const rows = await prisma.mikrotikTraffic.findMany({
        where: { routerId: id, createdAt: { gte: since } },
        orderBy: { createdAt: "asc" },
      })
      content = csv([
        ["Fecha", "Interfaz", "RX bytes", "TX bytes", "RX paquetes", "TX paquetes"],
        ...rows.map(r => [
          r.createdAt.toISOString(),
          r.iface,
          r.rxBytes.toFixed(0),
          r.txBytes.toFixed(0),
          r.rxPackets.toFixed(0),
          r.txPackets.toFixed(0),
        ]),
      ])
      break
    }
    case "interfaces":
    case "dhcp":
    case "arp":
    case "firewall":
    case "nat":
    case "routes":
    case "logs": {
      const config = mikrotikConfigFromRouter(router)
      const rows = (await resolveSection(config, section)) as Array<Record<string, unknown>>

      const headers: string[] = []
      const data: Array<Array<unknown>> = []
      for (const row of rows) {
        const line: Array<unknown> = []
        for (const key of Object.keys(row)) {
          if (!headers.includes(key)) headers.push(key)
          line.push(row[key])
        }
        data.push(line)
      }
      content = csv([headers, ...data])
      break
    }
  }

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
