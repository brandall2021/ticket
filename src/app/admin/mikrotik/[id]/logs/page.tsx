"use client"

import RosSectionTable, { type Column } from "@/components/mikrotik/ros-section-table"

const columns: Column[] = [
  { key: "time", label: "Hora" },
  {
    key: "topics",
    label: "Tópicos",
    format: v => {
      const s = String(v || "")
      const color = s.toLowerCase().includes("error") || s.toLowerCase().includes("critical")
        ? "text-red-500"
        : s.toLowerCase().includes("warning")
        ? "text-amber-500"
        : "text-neutral-500"
      return <span className={color}>{s || "—"}</span>
    },
  },
  { key: "message", label: "Mensaje" },
]

export default function LogsPage() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-neutral-200 bg-white p-4 text-xs text-neutral-500 dark:border-neutral-700/50 dark:bg-neutral-800/50">
        Últimos 200 logs del log principal. Los errores y warnings se resaltan en color.
      </div>
      <RosSectionTable section="logs" columns={columns} title="Logs del sistema" pollMs={15000} />
    </div>
  )
}