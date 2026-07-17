"use client"

import { useState, useEffect, useCallback } from "react"
import { Download, FileBarChart, Calendar } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, CartesianGrid, XAxis, YAxis } from "recharts"

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
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (desde) params.set("desde", desde)
    if (hasta) params.set("hasta", hasta)
    const res = await fetch(`/api/admin/monitor/dashboard?${params}`)
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [desde, hasta])

  useEffect(() => { fetchData() }, [fetchData])

  function exportReport() {
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
    lines.push(`Uptime: ${data.stats.uptime}%`)
    lines.push("")
    data.grupos.forEach(g => {
      lines.push(`── ${g.nombre} ──`)
      g.hosts.forEach(h => {
        const status = h.lastStatus || "SIN PING"
        const total = h.pings.length
        const ok = h.pings.filter(p => p.exitoso).length
        const pct = total > 0 ? ((ok / total) * 100).toFixed(1) : "0.0"
        lines.push(`  ${h.nombre} (${h.ip}) - ${status} - ${ok}/${total} OK (${pct}%)`)
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

  const pieData = data ? [
    { name: "Online", value: data.stats.hostsUp, color: "#22c55e" },
    { name: "Offline", value: data.stats.hostsDown, color: "#ef4444" },
    { name: "Sin ping", value: data.stats.hostsSinPing, color: "#71717a" },
  ].filter(d => d.value > 0) : []

  const grupoBarData = data?.grupos.map(g => {
    const total = g.hosts.length
    const ok = g.hosts.filter(h => h.lastStatus === "UP").length
    return { name: g.nombre, online: ok, offline: total - ok, pct: total > 0 ? ((ok / total) * 100).toFixed(0) : "0" }
  }) || []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <FileBarChart className="h-5 w-5 text-blue-500" /> Reportes
        </h2>
        <button onClick={exportReport} disabled={!data} className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 disabled:opacity-50">
          <Download className="h-4 w-4" /> Exportar
        </button>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700/50 dark:bg-neutral-800/50">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-neutral-400" />
            <span className="text-sm text-neutral-500">Desde</span>
          </div>
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100" />
          <span className="text-sm text-neutral-500">Hasta</span>
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100" />
          <button onClick={() => fetchData()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">Generar</button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-neutral-200 bg-white dark:border-neutral-700/50 dark:bg-neutral-800/50" />
          ))}
        </div>
      ) : data && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-center">
              <p className="text-3xl font-bold text-blue-500">{data.stats.totalHosts}</p>
              <p className="text-xs text-neutral-500">Total Hosts</p>
            </div>
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-center">
              <p className="text-3xl font-bold text-green-500">{data.stats.hostsUp}</p>
              <p className="text-xs text-neutral-500">Online</p>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
              <p className="text-3xl font-bold text-red-500">{data.stats.hostsDown}</p>
              <p className="text-xs text-neutral-500">Offline</p>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
              <p className="text-3xl font-bold text-amber-500">{data.stats.uptime}%</p>
              <p className="text-xs text-neutral-500">Uptime Global</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700/50 dark:bg-neutral-800/50">
              <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Estado General</h3>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                      {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#1c1c1c", border: "1px solid #333", borderRadius: "8px", color: "#fff" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[220px] items-center justify-center text-sm text-neutral-500">Sin datos</div>
              )}
              <div className="flex justify-center gap-4 text-xs">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-neutral-400">{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700/50 dark:bg-neutral-800/50">
              <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Disponibilidad por Grupo</h3>
              {grupoBarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={grupoBarData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="name" tick={{ fill: "#a3a3a3", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#a3a3a3", fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#1c1c1c", border: "1px solid #333", borderRadius: "8px", color: "#fff" }} />
                    <Bar dataKey="online" name="Online" fill="#22c55e" radius={[4,4,0,0]} />
                    <Bar dataKey="offline" name="Offline" fill="#ef4444" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[220px] items-center justify-center text-sm text-neutral-500">Sin datos</div>
              )}
            </div>
          </div>

          {data.grupos.map(grupo => {
            const total = grupo.hosts.length
            const up = grupo.hosts.filter(h => h.lastStatus === "UP").length
            return (
              <div key={grupo.id} className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-700/50 dark:bg-neutral-800/50">
                <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-700/50">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: grupo.color }} />
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{grupo.nombre}</h4>
                  </div>
                  <span className="text-xs text-neutral-500">{up}/{total} online</span>
                </div>
                <div className="divide-y divide-neutral-100 dark:divide-neutral-700/30">
                  {grupo.hosts.map(host => {
                    const totalPings = host.pings.length
                    const ok = host.pings.filter(p => p.exitoso).length
                    const pct = totalPings > 0 ? ((ok / totalPings) * 100).toFixed(1) : "0.0"
                    return (
                      <div key={host.id} className="flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700/20">
                        <div className="flex items-center gap-3">
                          <span className={`h-2 w-2 rounded-full ${host.lastStatus === "UP" ? "bg-green-500" : host.lastStatus === "DOWN" ? "bg-red-500" : "bg-neutral-400"}`} />
                          <div>
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{host.nombre}</span>
                            <span className="ml-2 text-xs text-neutral-500">{host.ip}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-neutral-500">{ok}/{totalPings}</span>
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                            <div className="h-full rounded-full transition-all" style={{
                              width: `${pct}%`,
                              backgroundColor: parseFloat(pct) >= 90 ? "#22c55e" : parseFloat(pct) >= 50 ? "#eab308" : "#ef4444",
                            }} />
                          </div>
                          <span className="w-12 text-right text-xs font-medium text-neutral-900 dark:text-neutral-100">{pct}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
