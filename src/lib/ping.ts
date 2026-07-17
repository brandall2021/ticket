import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export interface PingResult {
  exitoso: boolean
  latencia: number | null
  timeout: number
  detalle: string
}

export async function pingHost(ip: string, timeoutMs: number = 4000): Promise<PingResult> {
  const timeoutSec = Math.max(1, Math.ceil(timeoutMs / 1000))

  try {
    const { stdout } = await execAsync(
      `ping -c 1 -W ${timeoutSec} ${ip}`,
      { timeout: timeoutMs + 1000 }
    )

    const timeMatch = stdout.match(/time[=<](\d+\.?\d*)\s*ms/)
    const latencia = timeMatch ? parseFloat(timeMatch[1]) : null

    return {
      exitoso: true,
      latencia,
      timeout: timeoutMs,
      detalle: stdout.trim().split("\n").pop()?.trim() || "OK",
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      exitoso: false,
      latencia: null,
      timeout: timeoutMs,
      detalle: msg.includes("100% packet loss") ? "Sin respuesta" :
               msg.includes("Destination Host Unreachable") ? "Host inalcanzable" :
               msg.includes("Request timeout") ? "Timeout" :
               msg.substring(0, 200),
    }
  }
}

export async function pingMultiple(ips: string[], timeoutMs: number = 4000): Promise<Map<string, PingResult>> {
  const results = new Map<string, PingResult>()
  await Promise.all(
    ips.map(async (ip) => {
      const result = await pingHost(ip, timeoutMs)
      results.set(ip, result)
    })
  )
  return results
}
