"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ScrollText, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface AuditEntry {
  id: string
  accion: string
  detalle: string | null
  ip: string | null
  fecha: string
  usuario: { id: string; name: string; email: string }
}

interface PaginatedResponse {
  logs: AuditEntry[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })
}

const ACCION_COLORS: Record<string, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  LOGIN: "success",
  LOGOUT: "secondary",
  CREATE: "success",
  UPDATE: "warning",
  DELETE: "destructive",
  REGISTER: "success",
  PASSWORD_CHANGE: "warning",
  RESET_PASSWORD: "warning",
}

export default function AuditPage() {
  const router = useRouter()
  const [data, setData] = useState<PaginatedResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [accion, setAccion] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  const fetchLogs = useCallback(async (p: number, accionFilter: string, fromFilter: string, toFilter: string) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: "20" })
    if (accionFilter) params.set("accion", accionFilter)
    if (fromFilter) params.set("from", fromFilter)
    if (toFilter) params.set("to", toFilter)

    const res = await fetch(`/api/admin/audit?${params}`)
    const json = await res.json()
    setData(json)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchLogs(page, accion, from, to)
  }, [page, accion, from, to, fetchLogs])

  function handleFilterChange(newAccion: string, newFrom: string, newTo: string) {
    setAccion(newAccion)
    setFrom(newFrom)
    setTo(newTo)
    setPage(1)
  }

  const acciones = data?.logs
    ? [...new Set(data.logs.map((l) => l.accion))].sort()
    : []

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScrollText className="h-6 w-6 text-neutral-700 dark:text-neutral-300" />
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Auditoría</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push("/admin")}>
          Volver
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[180px] flex-1 space-y-1">
              <label className="text-xs font-medium text-neutral-500">Acción</label>
              <Select value={accion} onChange={(e) => handleFilterChange(e.target.value, from, to)}>
                <option value="">Todas</option>
                {acciones.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </Select>
            </div>
            <div className="min-w-[150px] flex-1 space-y-1">
              <label className="text-xs font-medium text-neutral-500">Desde</label>
              <Input type="date" value={from} onChange={(e) => handleFilterChange(accion, e.target.value, to)} />
            </div>
            <div className="min-w-[150px] flex-1 space-y-1">
              <label className="text-xs font-medium text-neutral-500">Hasta</label>
              <Input type="date" value={to} onChange={(e) => handleFilterChange(accion, from, e.target.value)} />
            </div>
            {(accion || from || to) && (
              <Button variant="ghost" size="sm" onClick={() => handleFilterChange("", "", "")}>
                Limpiar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registro de Auditoría</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 w-full animate-pulse rounded bg-neutral-200 dark:bg-navy-700" />
              ))}
            </div>
          ) : !data || data.logs.length === 0 ? (
            <p className="text-sm text-neutral-500">No hay registros de auditoría</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-neutral-500 dark:border-navy-700">
                      <th className="pb-3 pr-4 font-medium">Usuario</th>
                      <th className="pb-3 pr-4 font-medium">Acción</th>
                      <th className="pb-3 pr-4 font-medium">Detalle</th>
                      <th className="pb-3 pr-4 font-medium">IP</th>
                      <th className="pb-3 font-medium">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.logs.map((log) => (
                      <tr key={log.id} className="border-b last:border-0">
                        <td className="py-3 pr-4">
                          <div className="font-medium">{log.usuario.name}</div>
                          <div className="text-xs text-neutral-500">{log.usuario.email}</div>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={ACCION_COLORS[log.accion] || "outline"}>
                            {log.accion}
                          </Badge>
                        </td>
                        <td className="max-w-[300px] truncate py-3 pr-4 text-neutral-500">
                          {log.detalle || "—"}
                        </td>
                        <td className="py-3 pr-4 text-xs text-neutral-500">
                          {log.ip || "—"}
                        </td>
                        <td className="py-3 text-xs text-neutral-500">
                          {formatDateTime(log.fecha)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-neutral-500">
                  {data.pagination.total} registros · Página {data.pagination.page} de {data.pagination.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= data.pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
