"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { Loader2, RefreshCw, WifiOff } from "lucide-react"

export interface Column {
  key: string
  label: string
  format?: (value: unknown) => React.ReactNode
}

function defaultFormat(value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === "") return <span className="text-neutral-400">—</span>
  if (typeof value === "boolean") {
    return value
      ? <span className="text-green-500">Sí</span>
      : <span className="text-red-500">No</span>
  }
  return String(value)
}

export default function RosSectionTable({ section, columns, title, pollMs = 10000 }: {
  section: string
  columns: Column[]
  title?: string
  pollMs?: number
}) {
  const params = useParams()
  const id = params?.id as string

  const [rows, setRows] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/mikrotik/${id}/live?section=${section}`)
      const data = await res.json()
      if (data.ok) {
        setRows(Array.isArray(data.data) ? data.data : [data.data])
        setError("")
      } else {
        setError(data.error || "Error de conexión")
      }
    } catch (err) {
      setError(String(err))
    }
    setLastUpdate(new Date())
    setLoading(false)
  }, [id, section])

  useEffect(() => {
    const first = setTimeout(fetchData, 0)
    const timer = setInterval(fetchData, pollMs)
    return () => { clearTimeout(first); clearInterval(timer) }
  }, [fetchData, pollMs])

  if (loading && rows.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-700/50 dark:bg-neutral-800/50">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 p-4 dark:border-neutral-700/50">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title || section}</h3>
          <span className="rounded-full bg-neutral-500/10 px-2 py-0.5 text-xs text-neutral-500">{rows.length}</span>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdate && <span className="text-[10px] text-neutral-400">Actualizado {lastUpdate.toLocaleTimeString("es-AR")}</span>}
          <button
            onClick={() => { setLoading(true); fetchData() }}
            className="flex items-center gap-1 rounded-lg border border-neutral-300 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Refrescar
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 border-b border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">
          <WifiOff className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        {rows.length === 0 && !error ? (
          <div className="p-10 text-center text-sm text-neutral-500">Sin datos</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700/50">
                {columns.map(c => (
                  <th key={c.key} className="whitespace-nowrap px-4 py-3 text-xs font-medium text-neutral-500">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-neutral-100 transition-colors hover:bg-neutral-50 dark:border-neutral-700/30 dark:hover:bg-neutral-700/20">
                  {columns.map(c => (
                    <td key={c.key} className="whitespace-nowrap px-4 py-3">
                      <span className={
                        typeof row[c.key] === "object"
                          ? ""
                          : `text-neutral-900 dark:text-neutral-100`
                      }>
                        {c.format ? c.format(row[c.key]) : defaultFormat(row[c.key])}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export function copyToClipboard(text: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text)
  }
}