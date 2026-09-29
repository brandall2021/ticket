"use client"

import RosSectionTable, { type Column } from "@/components/mikrotik/ros-section-table"
import { formatBytes } from "@/lib/format"

const columns: Column[] = [
  { key: "name", label: "Nombre" },
  { key: "type", label: "Tipo" },
  {
    key: "running",
    label: "Activa",
    format: v => v
      ? <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-500">Running</span>
      : <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-500">Caída</span>,
  },
  {
    key: "disabled",
    label: "Deshabilitada",
    format: v => v ? <span className="rounded-full bg-neutral-500/10 px-2 py-0.5 text-xs text-neutral-500">Sí</span> : <span className="text-xs text-neutral-400">No</span>,
  },
  { key: "macAddress", label: "MAC" },
  {
    key: "rxBytes",
    label: "RX",
    format: v => <span className="font-mono text-green-500">{formatBytes(v as number)}</span>,
  },
  {
    key: "txBytes",
    label: "TX",
    format: v => <span className="font-mono text-blue-500">{formatBytes(v as number)}</span>,
  },
  {
    key: "rxErrors",
    label: "RX Errores",
    format: v => (v as number) || 0,
  },
  {
    key: "txErrors",
    label: "TX Errores",
    format: v => (v as number) || 0,
  },
  { key: "comment", label: "Comentario" },
]

export default function InterfacesPage() {
  return <RosSectionTable section="interfaces" columns={columns} title="Interfaces" pollMs={5000} />
}