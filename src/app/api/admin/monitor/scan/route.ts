import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/api-auth"
import { ROLES_ADMIN } from "@/lib/constants"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

interface ScanHost {
  ip: string
  hostname: string
  mac: string
  os: string
  status: "up" | "down"
}

export async function POST(req: NextRequest) {
  const authResult = await requireRole(ROLES_ADMIN)
  if (authResult.error) return authResult.error

  const { range } = await req.json()

  if (!range || typeof range !== "string") {
    return NextResponse.json({ error: "Rango requerido (ej: 192.168.32.0/22)" }, { status: 400 })
  }

  if (!/^[\d\.\/]+$/.test(range)) {
    return NextResponse.json({ error: "Formato de rango inválido" }, { status: 400 })
  }

  try {
    const { stdout } = await execAsync(
      `nmap -sn --open -T4 ${range}`,
      { timeout: 300000 }
    )

    const hosts: ScanHost[] = []
    const blocks = stdout.split("Nmap scan report for ")

    for (const block of blocks) {
      if (!block.trim()) continue

      const ipMatch = block.match(/(\d+\.\d+\.\d+\.\d+)/)
      const hostnameMatch = block.match(/^([^\(]+)\s*\(/)
      const macMatch = block.match(/MAC Address:\s*([0-9A-F:]{17})/i)
      const osMatch = block.match(/OS details?:\s*(.+)/i) ||
                      block.match(/Running:\s*(.+)/i)

      if (ipMatch) {
        hosts.push({
          ip: ipMatch[1],
          hostname: hostnameMatch ? hostnameMatch[1].trim() : "",
          mac: macMatch ? macMatch[1] : "",
          os: osMatch ? osMatch[1].trim() : "",
          status: "up",
        })
      }
    }

    return NextResponse.json({ hosts, total: hosts.length, range })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes("not found") || msg.includes("No such file")) {
      return NextResponse.json({ error: "nmap no está instalado. Instalalo con: apt-get install -y nmap" }, { status: 500 })
    }
    return NextResponse.json({ error: `Error en scan: ${msg.substring(0, 200)}` }, { status: 500 })
  }
}
