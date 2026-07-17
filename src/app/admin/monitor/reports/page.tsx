"use client"

import { useState, useEffect } from "react"
import { FileBarChart, ArrowLeft, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

interface ReportData {
  stats: {
    totalHosts: number
    hostsUp: number
    hostsDown: number
    hostsSinPing: number
    totalPings: number
    pingsExitosos: number
    pingsFallidos: number
    uptime: string
  }
  grupos: {
    id: string
    nombre: string
    color: string
    hosts: {
      id: string
      nombre: string
      ip: string
      lastStatus: string | null
      lastPingAt: string | null
      pings: { exitoso: boolean }[]
    }[]
  }[]
}

export default function MonitorReportsPage() {
  const router = useRouter()
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")

  useEffect(() => { fetchData() }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchData() {
    const params = new URLSearchParams()
    if (desde) params.set("desde", desde)
    if (hasta) params.set("hasta", hasta)

    const res = await fetch(`/api/admin/monitor/dashboard?${params}`)
    if (res.ok) setData(await res.json())
    setLoading(false)
  }

  function exportPDF() {
    if (!data) return
    const lines: string[] = []
    lines.push("REPORTE DE MONITORIZACIÓN")
    lines.push(`Fecha: ${new Date().toLocaleString("es-AR")}`)
    if (desde || hasta) lines.push(`Período: ${desde || "..."} al ${hasta || "..."}`)
    lines.push("")
    lines.push(`Total hosts: ${data.stats.totalHosts}`)
    lines.push(`Online: ${data.stats.hostsUp}`)
    lines.push(`Offline: ${data.stats.hostsDown}`)
    lines.push(`Sin ping: ${data.stats.hostsSinPing}`)
    lines.push(`Total pings: ${data.stats.totalPings}`)
    lines.push(`Exitosos: ${data.stats.pingsExitosos}`)
    lines.push(`Fallidos: ${data.stats.pingsFallidos}`)
    lines.push(`Uptime: ${data.stats.uptime}%`)
    lines.push("")

    data.grupos.forEach(g => {
      lines.push(`── ${g.nombre} ──`)
      g.hosts.forEach(h => {
        const status = h.lastStatus || "SIN PING"
        const total = h.pings.length
        const ok = h.pings.filter(p => p.exitoso).length
        const pct = total > 0 ? ((ok / total) * 100).toFixed(1) : "0.0"
        lines.push(`  ${h.nombre} (${h.ip}) - ${status} - ${ok}/${total} pings OK (${pct}%)`)
      })
      lines.push("")
    })

    const blob = new Blob([lines.join("\n")], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reporte-monitor-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl p-6 space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-neutral-200 dark:bg-navy-700" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/monitor")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            <FileBarChart className="mr-2 inline h-6 w-6" />
            Reportes
          </h1>
        </div>
        <Button variant="outline" size="sm" onClick={exportPDF} disabled={!data}>
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label>Desde</Label>
              <Input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1">
              <Label>Hasta</Label>
              <Input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="w-40" />
            </div>
            <Button size="sm" onClick={() => { setLoading(true); fetchData() }}>Generar</Button>
          </div>
        </CardContent>
      </Card>

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{data.stats.totalHosts}</p>
                <p className="text-xs text-neutral-500">Total Hosts</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-green-600">{data.stats.hostsUp}</p>
                <p className="text-xs text-neutral-500">Online</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-red-600">{data.stats.hostsDown}</p>
                <p className="text-xs text-neutral-500">Offline</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-blue-600">{data.stats.uptime}%</p>
                <p className="text-xs text-neutral-500">Uptime Global</p>
              </CardContent>
            </Card>
          </div>

          {data.grupos.map(grupo => {
            const total = grupo.hosts.length
            const up = grupo.hosts.filter(h => h.lastStatus === "UP").length
            const down = grupo.hosts.filter(h => h.lastStatus === "DOWN").length

            return (
              <Card key={grupo.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: grupo.color }} />
                    {grupo.nombre}
                    <span className="ml-auto text-sm font-normal text-neutral-500">
                      {up}/{total} online | {down} offline
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {grupo.hosts.map(host => {
                      const totalPings = host.pings.length
                      const ok = host.pings.filter(p => p.exitoso).length
                      const pct = totalPings > 0 ? ((ok / totalPings) * 100).toFixed(1) : "0.0"
                      return (
                        <div key={host.id} className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2 dark:border-navy-600 dark:bg-navy-700/50">
                          <div className="flex items-center gap-3">
                            <div className={`h-2 w-2 rounded-full ${host.lastStatus === "UP" ? "bg-green-500" : host.lastStatus === "DOWN" ? "bg-red-500" : "bg-neutral-400"}`} />
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{host.nombre}</span>
                            <span className="text-xs text-neutral-500">{host.ip}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-neutral-500">
                            <span>{ok}/{totalPings} pings OK</span>
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-neutral-200 dark:bg-navy-700">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: parseFloat(pct) >= 90 ? "#22c55e" : parseFloat(pct) >= 50 ? "#eab308" : "#ef4444",
                                }}
                              />
                            </div>
                            <span className="w-12 text-right">{pct}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </>
      )}
    </div>
  )
}
