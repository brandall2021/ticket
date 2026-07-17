"use client"

import { useState, useEffect } from "react"
import { Activity, Wifi, WifiOff, Server, AlertTriangle, RefreshCw, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface PingInfo {
  id: string
  exitoso: boolean
  latencia: number | null
  createdAt: string
}

interface Host {
  id: string
  nombre: string
  ip: string
  lastStatus: string | null
  lastPingAt: string | null
  pings: PingInfo[]
}

interface Grupo {
  id: string
  nombre: string
  color: string
  hosts: Host[]
}

interface UltimoPing {
  id: string
  exitoso: boolean
  latencia: number | null
  createdAt: string
  host: { id: string; nombre: string; ip: string }
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
  ultimosPings: UltimoPing[]
}

export default function MonitorDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [pingingAll, setPingingAll] = useState(false)

  async function fetchData() {
    const res = await fetch("/api/admin/monitor/dashboard")
    if (res.ok) setData(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  async function pingAll() {
    setPingingAll(true)
    await fetch("/api/admin/monitor/ping-all", { method: "POST" })
    await fetchData()
    setPingingAll(false)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-6 space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-neutral-200 dark:bg-navy-700" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-28 animate-pulse rounded-lg border border-neutral-200 bg-white dark:border-navy-700 dark:bg-navy-800" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return <div className="p-6 text-red-500">Error al cargar datos</div>

  const { stats, grupos, ultimosPings } = data

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          <Activity className="mr-2 inline h-6 w-6" />
          Monitorización
        </h1>
        <Button onClick={pingAll} disabled={pingingAll} size="sm">
          <RefreshCw className={`mr-2 h-4 w-4 ${pingingAll ? "animate-spin" : ""}`} />
          Ping All
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Server className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{stats.totalHosts}</p>
                <p className="text-xs text-neutral-500">Total Hosts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Wifi className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.hostsUp}</p>
                <p className="text-xs text-neutral-500">Online</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <WifiOff className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.hostsDown}</p>
                <p className="text-xs text-neutral-500">Offline</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{stats.uptime}%</p>
                <p className="text-xs text-neutral-500">Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Grupos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {grupos.length === 0 && (
              <p className="text-sm text-neutral-500">No hay grupos configurados</p>
            )}
            {grupos.map(grupo => {
              const up = grupo.hosts.filter(h => h.lastStatus === "UP").length
              const down = grupo.hosts.filter(h => h.lastStatus === "DOWN").length
              const sinPing = grupo.hosts.filter(h => !h.lastStatus).length
              return (
                <div key={grupo.id} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-navy-600 dark:bg-navy-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: grupo.color }} />
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">{grupo.nombre}</span>
                      <span className="text-xs text-neutral-500">({grupo.hosts.length} hosts)</span>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <span className="text-green-600">{up} UP</span>
                      <span className="text-red-600">{down} DOWN</span>
                      {sinPing > 0 && <span className="text-neutral-400">{sinPing} sin ping</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Últimos Pings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ultimosPings.length === 0 && (
              <p className="text-sm text-neutral-500">No hay pings registrados</p>
            )}
            {ultimosPings.map(ping => (
              <div key={ping.id} className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-navy-600 dark:bg-navy-700/50">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${ping.exitoso ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{ping.host.nombre}</span>
                  <span className="text-xs text-neutral-500">{ping.host.ip}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-500">
                  {ping.latencia !== null && <span>{ping.latencia}ms</span>}
                  <Clock className="h-3 w-3" />
                  <span>{new Date(ping.createdAt).toLocaleString("es-AR")}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
