"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"

interface AlertItem {
  id: string
  tipo: string
  nivel: string
  mensaje: string
  leida: boolean
  createdAt: string
}

const tipoLabels: Record<string, string> = {
  OFFLINE: "Router sin conexión",
  CPU_ALTA: "CPU alta",
  MEMORIA_BAJA: "Memoria baja",
  IFACE_DOWN: "Interfaz caída",
  RECUPERADO: "Recuperado",
}

export default function AlertasPage() {
  const params = useParams()
  const id = params?.id as string
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/mikrotik/${id}/alerts?limit=200`)
      const data = await res.json()
      if (data) setAlerts(data.alerts || [])
    } catch { /* empty */ }
    setLoading(false)
  }, [id])

  useEffect(() => { const t = setTimeout(fetchData, 0); return () => clearTimeout(t) }, [fetchData])

  async function markAllRead() {
    await fetch(`/api/admin/mikrotik/${id}/alerts`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leida: true }) })
    await fetchData()
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    )
  }

  const sinLeer = alerts.filter(a => !a.leida).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          <AlertTriangle className="h-4 w-4" />
          Alertas del router
          {sinLeer > 0 && (
            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-500">{sinLeer} sin leer</span>
          )}
        </h3>
        <button
          onClick={markAllRead}
          disabled={sinLeer === 0}
          className="flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-700"
        >
          <CheckCircle2 className="h-4 w-4" />
          Marcar todas como leídas
        </button>
      </div>

      {alerts.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 text-neutral-500 dark:border-neutral-700">
          <CheckCircle2 className="mb-2 h-8 w-8 text-green-500" />
          Sin alertas registradas
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-700/50 dark:bg-neutral-800/50">
          <div className="divide-y divide-neutral-100 dark:divide-neutral-700/30">
            {alerts.map(a => (
              <div key={a.id} className={`flex items-start gap-3 p-4 ${a.leida ? "opacity-60" : ""}`}>
                <div className={`mt-0.5 rounded-lg p-2 ${
                  a.nivel === "CRITICAL"
                    ? "bg-red-500/10 text-red-500"
                    : a.nivel === "WARNING"
                    ? "bg-amber-500/10 text-amber-500"
                    : "bg-green-500/10 text-green-500"
                }`}>
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-neutral-500/10 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:text-neutral-300">
                      {tipoLabels[a.tipo] || a.tipo}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      a.nivel === "CRITICAL" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                    }`}>
                      {a.nivel}
                    </span>
                    {!a.leida && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" title="Sin leer" />}
                  </div>
                  <p className="mt-1 text-sm text-neutral-900 dark:text-neutral-100">{a.mensaje}</p>
                  <p className="mt-0.5 text-[10px] text-neutral-400">{new Date(a.createdAt).toLocaleString("es-AR")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}