"use client"

import { useState, useEffect } from "react"
import { History, ArrowLeft, Filter, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

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
  const router = useRouter()
  const [pings, setPings] = useState<PingRecord[]>([])
  const [hosts, setHosts] = useState<MonitorHost[]>([])
  const [loading, setLoading] = useState(true)
  const [hostId, setHostId] = useState("")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [soloFallas, setSoloFallas] = useState(false)

  useEffect(() => {
    fetch("/api/admin/monitor/hosts").then(r => r.json()).then(setHosts)
    fetchPings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchPings() {
    setLoading(true)
    const params = new URLSearchParams()
    if (hostId) params.set("hostId", hostId)
    if (desde) params.set("desde", desde)
    if (hasta) params.set("hasta", hasta)
    if (soloFallas) params.set("soloFallas", "true")

    const res = await fetch(`/api/admin/monitor/history?${params}`)
    if (res.ok) setPings(await res.json())
    setLoading(false)
  }

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

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/monitor")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            <History className="mr-2 inline h-6 w-6" />
            Historial de Pings
          </h1>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV} disabled={pings.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          CSV
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label>Host</Label>
              <select value={hostId} onChange={e => setHostId(e.target.value)} className="h-9 rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm dark:border-navy-500 dark:bg-navy-800">
                <option value="">Todos</option>
                {hosts.map(h => <option key={h.id} value={h.id}>{h.nombre} ({h.ip})</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Desde</Label>
              <Input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1">
              <Label>Hasta</Label>
              <Input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="w-40" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={soloFallas} onChange={e => setSoloFallas(e.target.checked)} className="rounded" />
              Solo fallas
            </label>
            <Button size="sm" onClick={fetchPings}>
              <Filter className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resultados ({pings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-12 animate-pulse rounded bg-neutral-200 dark:bg-navy-700" />)}
            </div>
          ) : pings.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-500">No hay registros con los filtros seleccionados</p>
          ) : (
            <div className="space-y-1">
              {pings.map(ping => (
                <div key={ping.id} className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2 dark:border-navy-600 dark:bg-navy-700/50">
                  <div className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${ping.exitoso ? "bg-green-500" : "bg-red-500"}`} />
                    <div>
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{ping.host.nombre}</span>
                      <span className="ml-2 text-xs text-neutral-500">{ping.host.ip}</span>
                      {ping.host.grupo && (
                        <span className="ml-2 rounded-full border px-2 py-0.5 text-[10px]" style={{ borderColor: ping.host.grupo.color, color: ping.host.grupo.color }}>
                          {ping.host.grupo.nombre}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-neutral-500">
                    {ping.latencia !== null && <span>{ping.latencia}ms</span>}
                    <span>{ping.detalle}</span>
                    <span>{new Date(ping.createdAt).toLocaleString("es-AR")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
