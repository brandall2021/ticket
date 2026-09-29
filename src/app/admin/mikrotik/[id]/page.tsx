"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useParams } from "next/navigation"
import { RefreshCw, Cpu, MemoryStick, Clock, WifiOff, AlertTriangle, CheckCircle2, PlugZap, ArrowUpRight, ArrowDownRight, Router as RouterIcon } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { formatBytes, formatUptime, formatBitrate } from "@/lib/format"

interface ResourceData {
  version: string | null
  boardName: string | null
  architecture: string | null
  cpuLoad: number | null
  freeMemory: number | null
  totalMemory: number | null
  freeHdd: number | null
  totalHdd: number | null
  uptime: string | null
  uptimeSec: number | null
  processes: number | null
}

interface InterfaceData {
  name: string
  type: string | null
  running: boolean
  disabled: boolean
  macAddress: string | null
  rxBytes: number | null
  txBytes: number | null
  rxPackets: number | null
  txPackets: number | null
  rxErrors: number | null
  txErrors: number | null
}

interface HistoryData {
  snapshots: Array<{ time: string; cpu: number | null; memoryUsed: number | null; totalMemory: number | null }>
  trafficRate: Record<string, Array<{ time: string; rxBps: number; txBps: number }>>
}

interface AlertItem {
  id: string
  tipo: string
  nivel: string
  mensaje: string
  createdAt: string
  leida: boolean
}

const POLL_MS = 5000

export default function MikrotikDashboard() {
  const params = useParams()
  const id = params?.id as string

  const [resource, setResource] = useState<ResourceData | null>(null)
  const [interfaces, setInterfaces] = useState<InterfaceData[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [history, setHistory] = useState<HistoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [lasoUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchAll = useCallback(async () => {
    const [res, ifRes, alertRes, histRes] = await Promise.all([
      fetch(`/api/admin/mikrotik/${id}/live?section=resource`),
      fetch(`/api/admin/mikrotik/${id}/live?section=interfaces`),
      fetch(`/api/admin/mikrotik/${id}/alerts?limit=8`),
      fetch(`/api/admin/mikrotik/${id}/history?hours=24`),
    ])

    const resData = await res.json()
    if (resData.ok) setResource(resData.data)
    else setError(resData.error || "Error de conexión")

    const ifData = await ifRes.json()
    if (ifData.ok) setInterfaces(ifData.data)

    const alertData = await alertRes.json()
    if (alertData) setAlerts(alertData.alerts || [])

    const histData = await histRes.json()
    if (histData) setHistory(histData)

    setLastUpdated(new Date())
    setLoading(false)
  }, [id])

  useEffect(() => {
    const first = setTimeout(fetchAll, 0)
    const timer = setInterval(fetchAll, POLL_MS)
    return () => { clearTimeout(first); clearInterval(timer) }
  }, [fetchAll])

  async function refreshNow() {
    setLoading(true)
    await fetchAll()
    setLoading(false)
  }

  const totalRx = useMemo(() => interfaces.reduce((s, i) => s + (i.rxBytes || 0), 0), [interfaces])
  const totalTx = useMemo(() => interfaces.reduce((s, i) => s + (i.txBytes || 0), 0), [interfaces])
  const downIfaces = useMemo(() => interfaces.filter(i => !i.running && !i.disabled), [interfaces])
  const activeIfaces = useMemo(() => {
    if (!history) return []
    const rates = history.trafficRate
    return Object.keys(rates).slice(0, 6).map(iface => {
      const series = rates[iface]
      return {
        iface,
        rx: series.length ? series[series.length - 1].rxBps : 0,
        tx: series.length ? series[series.length - 1].txBps : 0,
      }
    })
  }, [history])

  const cpuSeries = useMemo(() => history?.snapshots.map(s => ({ time: new Date(s.time).toLocaleTimeString("es-AR"), cpu: s.cpu })) || [], [history])

  if (loading && !resource) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 animate-pulse rounded-xl border border-neutral-200 bg-white dark:border-neutral-700/50 dark:bg-neutral-800/50" />)}
        </div>
        <div className="h-80 animate-pulse rounded-xl border border-neutral-200 bg-white dark:border-neutral-700/50 dark:bg-neutral-800/50" />
      </div>
    )
  }

  const memUsed = resource?.totalMemory && resource?.freeMemory !== null && resource?.freeMemory !== undefined
    ? resource.totalMemory - resource.freeMemory
    : null
  const memPct = resource?.totalMemory && resource.totalMemory > 0 && memUsed !== null && memUsed !== undefined && memUsed >= 0
    ? Math.min(100, (memUsed / resource.totalMemory) * 100)
    : null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-neutral-900 dark:text-neutral-100">
            <RouterIcon className="h-5 w-5" />
            {resource?.boardName || "Router"} — RouterOS {resource?.version}
            <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> ONLINE
            </span>
          </h2>
          <p className="flex items-center gap-1 text-sm text-neutral-500">
            <Clock className="h-3.5 w-3.5" />
            Uptime: {formatUptime(resource?.uptimeSec)} · {resource?.architecture}
            {resource?.processes !== null && resource?.processes !== undefined ? ` · ${resource.processes} procesos` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lasoUpdated && <span className="text-[10px] text-neutral-400">Actualizado {lasoUpdated.toLocaleTimeString("es-AR")} (auto cada 5s)</span>}
          <button
            onClick={refreshNow}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refrescar
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600">
          <WifiOff className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={<Cpu className="h-5 w-5" />}
          label="CPU Load"
          value={resource?.cpuLoad !== null && resource?.cpuLoad !== undefined ? `${resource.cpuLoad}%` : "—"}
          color={resource?.cpuLoad !== null && resource?.cpuLoad !== undefined && resource.cpuLoad >= 90 ? "red" : "blue"}
          subtitle={`${resource?.processes ?? "—"} procesos`}
        />
        <StatCard
          icon={<MemoryStick className="h-5 w-5" />}
          label="Memoria"
          value={memPct !== null && memPct !== undefined ? `${memPct.toFixed(1)}%` : "—"}
          color={memPct !== null && memPct !== undefined && memPct >= 90 ? "red" : memPct !== null && memPct !== undefined && memPct >= 70 ? "amber" : "green"}
          subtitle={`${formatBytes(resource?.freeMemory)} libre`}
        />
        <StatCard
          icon={<ArrowDownRight className="h-5 w-5" />}
          label="RX Total (acumulado)"
          value={formatBytes(totalRx)}
          color="green"
          subtitle={`${activeIfaces.reduce((s, i) => s + i.rx, 0) > 0 ? "RX realtime " + formatBitrate(activeIfaces.reduce((s, i) => s + i.rx, 0)) : "sin tráfico realtime"}`}
        />
        <StatCard
          icon={<ArrowUpRight className="h-5 w-5" />}
          label="TX Total (acumulado)"
          value={formatBytes(totalTx)}
          color="blue"
          subtitle={`${activeIfaces.reduce((s, i) => s + i.tx, 0) > 0 ? "TX realtime " + formatBitrate(activeIfaces.reduce((s, i) => s + i.tx, 0)) : "sin tráfico realtime"}`}
        />
      </div>

      {downIfaces.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Interfaz{downIfaces.length > 1 ? "es" : ""} activa caída: {downIfaces.map(i => i.name).join(", ")}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700/50 dark:bg-neutral-800/50">
          <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Uso de CPU (24hs)</h3>
          {cpuSeries.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={cpuSeries}>
                <defs>
                  <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="time" tick={{ fill: "#a3a3a3", fontSize: 11 }} interval="preserveStartEnd" minTickGap={40} />
                <YAxis tick={{ fill: "#a3a3a3", fontSize: 11 }} unit="%" domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: "#1c1c1c", border: "1px solid #333", borderRadius: "8px", color: "#fff" }} formatter={((value: number | string | undefined) => [`${typeof value === "number" ? value : "—"}%`, "CPU"]) as never} />
                <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fill="url(#cpuGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-neutral-500">
              Sin datos históricos. El cron no se ha ejecutado aún (CRON_SECRET + programar).
            </div>
          )}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700/50 dark:bg-neutral-800/50">
          <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Tráfico por interfaz (realtime, 24hs)</h3>
          {activeIfaces.length > 0 ? (
            <div className="h-[200px] overflow-y-auto pr-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 dark:border-neutral-700/50">
                    <th className="py-2">Interfaz</th>
                    <th className="py-2">RX</th>
                    <th className="py-2">TX</th>
                  </tr>
                </thead>
                <tbody>
                  {activeIfaces.map(i => (
                    <tr key={i.iface} className="border-b border-neutral-100 dark:border-neutral-700/30">
                      <td className="py-1.5 font-medium text-neutral-900 dark:text-neutral-100">{i.iface}</td>
                      <td className="py-1.5 font-mono text-green-500">↓ {formatBitrate(i.rx)}</td>
                      <td className="py-1.5 font-mono text-blue-500">↑ {formatBitrate(i.tx)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-neutral-500">Sin datos de tráfico</div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700/50 dark:bg-neutral-800/50 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Interfaces</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700/50">
                  <th className="px-3 py-2 text-xs font-medium text-neutral-500">Estado</th>
                  <th className="px-3 py-2 text-xs font-medium text-neutral-500">Nombre</th>
                  <th className="px-3 py-2 text-xs font-medium text-neutral-500">Tipo</th>
                  <th className="px-3 py-2 text-xs font-medium text-neutral-500">Mac Address</th>
                  <th className="px-3 py-2 text-xs font-medium text-neutral-500">RX</th>
                  <th className="px-3 py-2 text-xs font-medium text-neutral-500">TX</th>
                </tr>
              </thead>
              <tbody>
                {interfaces.map(i => (
                  <tr key={i.name} className="border-b border-neutral-100 dark:border-neutral-700/30">
                    <td className="px-3 py-2">
                      {i.disabled ? (
                        <span className="text-xs text-neutral-400">Disabled</span>
                      ) : i.running ? (
                        <span className="flex items-center gap-1 text-xs text-green-500"><PlugZap className="h-3 w-3" /> Running</span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-red-500"><PlugZap className="h-3 w-3" /> Caída</span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-medium text-neutral-900 dark:text-neutral-100">{i.name}</td>
                    <td className="px-3 py-2 text-xs text-neutral-500">{i.type}</td>
                    <td className="px-3 py-2 font-mono text-xs text-neutral-500">{i.macAddress || "—"}</td>
                    <td className="px-3 py-2 font-mono text-xs text-green-500">{formatBytes(i.rxBytes)}</td>
                    <td className="px-3 py-2 font-mono text-xs text-blue-500">{formatBytes(i.txBytes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700/50 dark:bg-neutral-800/50">
          <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Alertas recientes</h3>
          {alerts.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-neutral-500">
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Sin alertas
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map(a => (
                <div key={a.id} className={`flex items-start gap-2 rounded-lg border p-2 text-xs ${
                  a.nivel === "CRITICAL"
                    ? "border-red-500/30 bg-red-500/10 text-red-600"
                    : a.nivel === "WARNING"
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-600"
                    : "border-green-500/30 bg-green-500/10 text-green-600"
                }`}>
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <div>
                    <p className="font-medium">{a.mensaje}</p>
                    <p className="text-[10px] opacity-70">{new Date(a.createdAt).toLocaleString("es-AR")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-2 text-right">

          </div>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700/50 dark:bg-neutral-800/50">
        <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Uso de memoria (24hs)</h3>
        {history?.snapshots && history.snapshots.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={history.snapshots.map(s => ({ time: new Date(s.time).toLocaleTimeString("es-AR"), usada: s.memoryUsed ? s.memoryUsed / 1024 / 1024 : 0, total: s.totalMemory ? s.totalMemory / 1024 / 1024 : 0 }))}>
              <defs>
                <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="time" tick={{ fill: "#a3a3a3", fontSize: 11 }} minTickGap={40} />
              <YAxis tick={{ fill: "#a3a3a3", fontSize: 11 }} unit=" MB" />
              <Tooltip contentStyle={{ backgroundColor: "#1c1c1c", border: "1px solid #333", borderRadius: "8px", color: "#fff" }} formatter={((value: number | string | undefined, name: number | string | undefined) => [`${typeof value === "number" ? value.toFixed(0) : 0} MB`, name === "usada" ? "Usada" : "Total"]) as never} />
              <Legend wrapperStyle={{ color: "#a3a3a3", fontSize: 12 }} />
              <Area type="monotone" dataKey="total" name="Total" stroke="#8b5cf6" fill="none" strokeWidth={1} strokeDasharray="4 4" />
              <Area type="monotone" dataKey="usada" name="Usada" stroke="#8b5cf6" fill="url(#memGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[200px] items-center justify-center text-sm text-neutral-500">Sin datos históricos de memoria</div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color, trend, subtitle }: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  color: "blue" | "green" | "red" | "amber"
  trend?: React.ReactNode
  subtitle?: string
}) {
  const colors = {
    blue: "from-blue-500/10 to-blue-600/5 text-blue-500 border-blue-500/20",
    green: "from-green-500/10 to-green-600/5 text-green-500 border-green-500/20",
    red: "from-red-500/10 to-red-600/5 text-red-500 border-red-500/20",
    amber: "from-amber-500/10 to-amber-600/5 text-amber-500 border-amber-500/20",
  }

  return (
    <div className={`rounded-xl border bg-gradient-to-br p-4 dark:border-neutral-700/50 dark:bg-neutral-800/50 ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <div className={`rounded-lg p-2 ${colors[color].split(" ").slice(0, 2).join(" ")}`}>
          {icon}
        </div>
        {trend && <span className="text-xs font-medium">{trend}</span>}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
        <p className="text-xs text-neutral-500">{label}</p>
        {subtitle && <p className="mt-0.5 text-[10px] text-neutral-400">{subtitle}</p>}
      </div>
    </div>
  )
}