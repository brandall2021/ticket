"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { FileBarChart, Download, Loader2 } from "lucide-react"

const reportSections = [
  { id: "snapshots", label: "Snapshots (CPU/Memoria/Uptime)", desc: "Histórico del cron por horas" },
  { id: "traffic", label: "Tráfico por interfaz", desc: "Contadores RX/TX acumulados por snapshot" },
  { id: "interfaces", label: "Interfaces actuales", desc: "Estado y contadores en vivo" },
  { id: "dhcp", label: "DHCP Leases actuales", desc: "Concesiones activas" },
  { id: "arp", label: "Clientes conectados (ARP)", desc: "Tabla ARP en vivo" },
  { id: "firewall", label: "Reglas de firewall", desc: "Filter en vivo" },
  { id: "nat", label: "Reglas NAT", desc: "NAT en vivo" },
  { id: "routes", label: "Rutas IP", desc: "Tabla de rutas en vivo" },
  { id: "logs", label: "Logs", desc: "Últimos logs en vivo" },
]

export default function ReportesPage() {
  const params = useParams()
  const id = params?.id as string
  const [hours, setHours] = useState(24)
  const [exporting, setExporting] = useState<string | null>(null)
  const [routerName, setRouterName] = useState("")

  const fetchRouter = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/mikrotik/${id}`)
      if (res.ok) {
        const data = await res.json()
        setRouterName(data.nombre)
      }
    } catch { /* empty */ }
  }, [id])

  useEffect(() => { const t = setTimeout(fetchRouter, 0); return () => clearTimeout(t) }, [fetchRouter])

  async function exportCsv(section: string) {
    setExporting(section)
    try {
      const res = await fetch(`/api/admin/mikrotik/${id}/report?section=${section}&hours=${hours}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error || "Error al exportar")
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      const contentDisp = res.headers.get("Content-Disposition") || ""
      const match = contentDisp.match(/filename="(.+)"/)
      a.href = url
      a.download = match ? match[1] : `mikrotik-${section}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(String(err))
    }
    setExporting(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          <FileBarChart className="h-4 w-4" />
          Exportación de reportes {routerName ? `— ${routerName}` : ""}
        </h3>
        <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
          Ventana de tiempo (históricos):
          <select
            value={hours}
            onChange={e => setHours(parseInt(e.target.value))}
            className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
          >
            <option value={6}>6 horas</option>
            <option value={12}>12 horas</option>
            <option value={24}>24 horas</option>
            <option value={72}>3 días</option>
            <option value={168}>7 días</option>
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {reportSections.map(s => (
          <div key={s.id} className="flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700/50 dark:bg-neutral-800/50">
            <div>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">{s.label}</p>
              <p className="mt-1 text-xs text-neutral-500">{s.desc}</p>
            </div>
            <button
              onClick={() => exportCsv(s.id)}
              disabled={exporting !== null}
              className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700 disabled:opacity-50"
            >
              {exporting === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Exportar CSV
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-600">
        Nota: los reportes históricos (snapshots y tráfico) requieren que el cron esté configurado
        (CRON_SECRET + programación cada 1-5 min). Las secciones en vivo se exportan con consulta directa
        al router en el momento de la exportación.
      </div>
    </div>
  )
}