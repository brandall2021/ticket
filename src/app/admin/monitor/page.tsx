"use client"

import { useState, useEffect, useCallback } from "react"
import { Activity, Wifi, WifiOff, AlertTriangle, RefreshCw, Server, Clock, TrendingUp, ArrowUpRight, ArrowDownRight, Minus, Radio, Globe, Shield } from "lucide-react"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface PingInfo {
  id: string
  exitoso: boolean
  latencia: number | null
  createdAt: string
  detalle?: string | null
}

interface Host {
  id: string
  nombre: string
  ip: string
  detalle: string | null
  lastStatus: string | null
  lastPingAt: string | null
  grupo: { nombre: string; color: string } | null
  pings: PingInfo[]
}

interface Grupo {
  id: string
  nombre: string
  color: string
  hosts: Host[]
}

interface DashboardData {
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
  grupos: Grupo[]
  ultimosPings: (PingInfo & { host: { nombre: string; ip: string } })[]
  allHosts: Host[]
}

export default function MonitorDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [pingingAll, setPingingAll] = useState(false)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, hostsRes] = await Promise.all([
        fetch("/api/admin/monitor/dashboard"),
        fetch("/api/admin/monitor/hosts"),
      ])
      if (dashRes.ok && hostsRes.ok) {
        const dash = await dashRes.json()
        const hosts = await hostsRes.json()
        setData({ ...dash, allHosts: hosts })
      }
    } catch { /* empty */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function pingAll() {
    setPingingAll(true)
    await fetch("/api/admin/monitor/ping-all", { method: "POST" })
    await fetchData()
    setPingingAll(false)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-neutral-200 bg-white dark:border-neutral-700/50 dark:bg-neutral-800/50" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-xl border border-neutral-200 bg-white dark:border-neutral-700/50 dark:bg-neutral-800/50" />
      </div>
    )
  }

  if (!data) return null

  const { stats, allHosts, ultimosPings } = data

  const filteredHosts = allHosts.filter(h => {
    const matchSearch = !search ||
      h.nombre.toLowerCase().includes(search.toLowerCase()) ||
      h.ip.includes(search) ||
      h.grupo?.nombre.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "all" ||
      (filterStatus === "up" && h.lastStatus === "UP") ||
      (filterStatus === "down" && h.lastStatus === "DOWN") ||
      (filterStatus === "unknown" && !h.lastStatus)
    return matchSearch && matchStatus
  })

  const upPercent = stats.totalHosts > 0 ? ((stats.hostsUp / stats.totalHosts) * 100).toFixed(0) : "0"
  const downPercent = stats.totalHosts > 0 ? ((stats.hostsDown / stats.totalHosts) * 100).toFixed(0) : "0"

  const pieData = [
    { name: "Online", value: stats.hostsUp, color: "#22c55e" },
    { name: "Offline", value: stats.hostsDown, color: "#ef4444" },
    { name: "Sin ping", value: stats.hostsSinPing, color: "#71717a" },
  ].filter(d => d.value > 0)

  const latencyData = ultimosPings
    .filter(p => p.latencia !== null)
    .slice(0, 12)
    .reverse()
    .map(p => ({
      name: p.host.nombre.substring(0, 10),
      latencia: p.latencia,
      exitoso: p.exitoso,
    }))

  const groupBarData = data.grupos.map(g => ({
    name: g.nombre,
    up: g.hosts.filter(h => h.lastStatus === "UP").length,
    down: g.hosts.filter(h => h.lastStatus === "DOWN").length,
    total: g.hosts.length,
  }))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
          Panel de Monitorización
        </h2>
        <button
          onClick={pingAll}
          disabled={pingingAll}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${pingingAll ? "animate-spin" : ""}`} />
          Ping All
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={<Server className="h-5 w-5" />}
          label="Total Dispositivos"
          value={stats.totalHosts}
          color="blue"
          trend={`${upPercent}% online`}
        />
        <StatCard
          icon={<Wifi className="h-5 w-5" />}
          label="En Línea"
          value={stats.hostsUp}
          color="green"
          trend={`${upPercent}%`}
          trendUp
        />
        <StatCard
          icon={<WifiOff className="h-5 w-5" />}
          label="Fuera de Línea"
          value={stats.hostsDown}
          color="red"
          trend={`${downPercent}%`}
          trendDown
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Uptime Global"
          value={`${stats.uptime}%`}
          color="amber"
          subtitle={`${stats.totalPings} pings totales`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700/50 dark:bg-neutral-800/50 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Disponibilidad por Grupo</h3>
          {groupBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={groupBarData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="name" tick={{ fill: "#a3a3a3", fontSize: 12 }} />
                <YAxis tick={{ fill: "#a3a3a3", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1c1c1c", border: "1px solid #333", borderRadius: "8px", color: "#fff" }}
                />
                <Bar dataKey="up" name="Online" fill="#22c55e" radius={[4,4,0,0]} />
                <Bar dataKey="down" name="Offline" fill="#ef4444" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-sm text-neutral-500">Sin datos</div>
          )}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700/50 dark:bg-neutral-800/50">
          <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Estado General</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#1c1c1c", border: "1px solid #333", borderRadius: "8px", color: "#fff" }}
                />
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
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700/50 dark:bg-neutral-800/50">
        <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Latencia Reciente</h3>
        {latencyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={latencyData}>
              <defs>
                <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="name" tick={{ fill: "#a3a3a3", fontSize: 11 }} />
              <YAxis tick={{ fill: "#a3a3a3", fontSize: 11 }} unit="ms" />
              <Tooltip
                contentStyle={{ backgroundColor: "#1c1c1c", border: "1px solid #333", borderRadius: "8px", color: "#fff" }}
                formatter={(value) => [`${value}ms`, "Latencia"]}
              />
              <Area type="monotone" dataKey="latencia" stroke="#3b82f6" fill="url(#latencyGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[200px] items-center justify-center text-sm text-neutral-500">Sin datos de latencia</div>
        )}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-700/50 dark:bg-neutral-800/50">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 p-4 dark:border-neutral-700/50">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Dispositivos</h3>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Buscar por nombre, IP o grupo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 w-48 rounded-lg border border-neutral-300 bg-white px-3 text-xs text-neutral-900 placeholder-neutral-400 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 dark:placeholder-neutral-500"
            />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="h-8 rounded-lg border border-neutral-300 bg-white px-2 text-xs text-neutral-900 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
            >
              <option value="all">Todos</option>
              <option value="up">Online</option>
              <option value="down">Offline</option>
              <option value="unknown">Sin ping</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700/50">
                <th className="px-4 py-3 text-xs font-medium text-neutral-500">Estado</th>
                <th className="px-4 py-3 text-xs font-medium text-neutral-500">Hostname</th>
                <th className="px-4 py-3 text-xs font-medium text-neutral-500">IP</th>
                <th className="px-4 py-3 text-xs font-medium text-neutral-500">Grupo</th>
                <th className="px-4 py-3 text-xs font-medium text-neutral-500">Latencia</th>
                <th className="px-4 py-3 text-xs font-medium text-neutral-500">Detalle</th>
                <th className="px-4 py-3 text-xs font-medium text-neutral-500">Última Verificación</th>
              </tr>
            </thead>
            <tbody>
              {filteredHosts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-neutral-500">
                    No se encontraron dispositivos
                  </td>
                </tr>
              ) : (
                filteredHosts.map(host => {
                  const lastPing = host.pings[0]
                  const status = host.lastStatus
                  return (
                    <tr key={host.id} className="border-b border-neutral-100 transition-colors hover:bg-neutral-50 dark:border-neutral-700/30 dark:hover:bg-neutral-700/20">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          status === "UP"
                            ? "bg-green-500/10 text-green-500"
                            : status === "DOWN"
                            ? "bg-red-500/10 text-red-500"
                            : "bg-neutral-500/10 text-neutral-500"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            status === "UP" ? "bg-green-500" : status === "DOWN" ? "bg-red-500" : "bg-neutral-500"
                          }`} />
                          {status === "UP" ? "Online" : status === "DOWN" ? "Offline" : "Sin ping"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">{host.nombre}</td>
                      <td className="px-4 py-3 font-mono text-xs text-neutral-500">{host.ip}</td>
                      <td className="px-4 py-3">
                        {host.grupo ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: `${host.grupo.color}15`, color: host.grupo.color }}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: host.grupo.color }} />
                            {host.grupo.nombre}
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {lastPing?.latencia !== null && lastPing?.latencia !== undefined ? (
                          <span className={`font-mono text-xs ${
                            lastPing.latencia < 50 ? "text-green-500" : lastPing.latencia < 200 ? "text-amber-500" : "text-red-500"
                          }`}>
                            {lastPing.latencia}ms
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {lastPing ? (
                          <span className={`text-xs ${lastPing.exitoso ? "text-green-500" : "text-red-500"}`}>
                            {lastPing.detalle?.substring(0, 30) || "—"}
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-500">
                        {host.lastPingAt ? new Date(host.lastPingAt).toLocaleString("es-AR") : "Nunca"}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color, trend, trendUp, trendDown, subtitle }: {
  icon: React.ReactNode
  label: string
  value: string | number
  color: "blue" | "green" | "red" | "amber"
  trend?: string
  trendUp?: boolean
  trendDown?: boolean
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
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${
            trendUp ? "text-green-500" : trendDown ? "text-red-500" : "text-neutral-400"
          }`}>
            {trendUp ? <ArrowUpRight className="h-3 w-3" /> : trendDown ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            {trend}
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
        <p className="text-xs text-neutral-500">{label}</p>
        {subtitle && <p className="mt-0.5 text-[10px] text-neutral-400">{subtitle}</p>}
      </div>
    </div>
  )
}
