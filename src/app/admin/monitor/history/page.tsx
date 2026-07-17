"use client"

import { useState, useEffect, useCallback } from "react"
import { History, Download, Search, Filter, ArrowDownRight, ArrowUpRight } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface PingRecord {
  id: string
  exitoso: boolean
  latencia: number | null
  timeout: number
  detalle: string | null
  createdAt: string
  host: {
    id: string
    nombre: string
    ip: string
    grupo: { nombre: string; color: string } | null
  }
}

interface MonitorHost {
  id: string
  nombre: string
  ip: string
}

export default function MonitorHistoryPage() {
  const [pings, setPings] = useState<PingRecord[]>([])
  const [hosts, setHosts] = useState<MonitorHost[]>([])
  const [loading, setLoading] = useState(true)
  const [hostId, setHostId] = useState("")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [soloFallas, setSoloFallas] = useState(false)

  useEffect(() => {
    fetch("/api/admin/monitor/hosts").then(r => r.json()).then(setHosts)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchPings = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (hostId) params.set("hostId", hostId)
    if (desde) params.set("desde", desde)
    if (hasta) params.set("hasta", hasta)
    if (soloFallas) params.set("soloFallas", "true")
    const res = await fetch(`/api/admin/monitor/history?${params}`)
    if (res.ok) setPings(await res.json())
    setLoading(false)
  }, [hostId, desde, hasta, soloFallas])

  useEffect(() => { fetchPings() }, [fetchPings])

  function exportCSV() {
    const header = "Host,IP,Grupo,Estado,Latencia(ms),Detalle,Fecha\n"
    const rows = pings.map(p =>
      `"${p.host.nombre}","${p.host.ip}","${p.host.grupo?.nombre || "Sin grupo"}",${p.exitoso ? "OK" : "FALLA"},${p.latencia ?? ""},"${(p.detalle || "").replace(/"/g, '""')}","${new Date(p.createdAt).toLocaleString("es-AR")}"`
    ).join("\n")
    const blob = new Blob([header + rows], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `historial-pings-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const chartData = pings
    .filter(p => p.latencia !== null)
    .slice(0, 30)
    .reverse()
    .map(p => ({
      name: p.host.nombre.substring(0, 8),
      latencia: p.latencia,
      exitoso: p.exitoso,
    }))

  const total = pings.length
  const ok = pings.filter(p => p.exitoso).length
  const fail = total - ok

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Historial de Pings</h2>
        <button onClick={exportCSV} disabled={pings.length === 0} className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 disabled:opacity-50">
          <Download className="h-4 w-4" /> Exportar CSV
        </button>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700/50 dark:bg-neutral-800/50">
        <div className="flex flex-wrap items-end gap-3">
          <select value={hostId} onChange={e => setHostId(e.target.value)} className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100">
            <option value="">Todos los hosts</option>
            {hosts.map(h => <option key={h.id} value={h.id}>{h.nombre} ({h.ip})</option>)}
          </select>
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100" />
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100" />
          <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            <input type="checkbox" checked={soloFallas} onChange={e => setSoloFallas(e.target.checked)} className="rounded" />
            Solo fallas
          </label>
        </div>
      </div>

      {total > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-neutral-200 bg-white p-3 text-center dark:border-neutral-700/50 dark:bg-neutral-800/50">
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{total}</p>
            <p className="text-xs text-neutral-500">Total</p>
          </div>
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3 text-center">
            <p className="text-2xl font-bold text-green-500">{ok}</p>
            <p className="text-xs text-neutral-500">Exitosos</p>
          </div>
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-center">
            <p className="text-2xl font-bold text-red-500">{fail}</p>
            <p className="text-xs text-neutral-500">Fallidos</p>
          </div>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700/50 dark:bg-neutral-800/50">
          <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Latencia</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="name" tick={{ fill: "#a3a3a3", fontSize: 11 }} />
              <YAxis tick={{ fill: "#a3a3a3", fontSize: 11 }} unit="ms" />
              <Tooltip contentStyle={{ backgroundColor: "#1c1c1c", border: "1px solid #333", borderRadius: "8px", color: "#fff" }} />
              <Area type="monotone" dataKey="latencia" stroke="#3b82f6" fill="url(#histGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-700/50 dark:bg-neutral-800/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700/50">
                <th className="px-4 py-3 text-xs font-medium text-neutral-500">Estado</th>
                <th className="px-4 py-3 text-xs font-medium text-neutral-500">Host</th>
                <th className="px-4 py-3 text-xs font-medium text-neutral-500">IP</th>
                <th className="px-4 py-3 text-xs font-medium text-neutral-500">Grupo</th>
                <th className="px-4 py-3 text-xs font-medium text-neutral-500">Latencia</th>
                <th className="px-4 py-3 text-xs font-medium text-neutral-500">Detalle</th>
                <th className="px-4 py-3 text-xs font-medium text-neutral-500">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3].map(i => (
                  <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-10 animate-pulse rounded bg-neutral-100 dark:bg-neutral-700/50" /></td></tr>
                ))
              ) : pings.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-16 text-center text-neutral-500">No hay registros</td></tr>
              ) : (
                pings.map(ping => (
                  <tr key={ping.id} className="border-b border-neutral-100 transition-colors hover:bg-neutral-50 dark:border-neutral-700/30 dark:hover:bg-neutral-700/20">
                    <td className="px-4 py-2.5">
                      {ping.exitoso ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500">
                          <ArrowUpRight className="h-3 w-3" /> OK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-500">
                          <ArrowDownRight className="h-3 w-3" /> FALLA
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-neutral-900 dark:text-neutral-100">{ping.host.nombre}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-neutral-500">{ping.host.ip}</td>
                    <td className="px-4 py-2.5">
                      {ping.host.grupo ? (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: `${ping.host.grupo.color}15`, color: ping.host.grupo.color }}>
                          {ping.host.grupo.nombre}
                        </span>
                      ) : <span className="text-xs text-neutral-400">—</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      {ping.latencia !== null ? (
                        <span className={`font-mono text-xs ${ping.latencia < 50 ? "text-green-500" : ping.latencia < 200 ? "text-amber-500" : "text-red-500"}`}>
                          {ping.latencia}ms
                        </span>
                      ) : <span className="text-xs text-neutral-400">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-neutral-500 max-w-[200px] truncate">{ping.detalle || "—"}</td>
                    <td className="px-4 py-2.5 text-xs text-neutral-500">{new Date(ping.createdAt).toLocaleString("es-AR")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
