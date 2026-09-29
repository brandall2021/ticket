"use client"

import RosSectionTable, { type Column } from "@/components/mikrotik/ros-section-table"

const columns: Column[] = [
  { key: "address", label: "Dirección" },
  { key: "network", label: "Red" },
  { key: "broadcast", label: "Broadcast" },
  { key: "interface", label: "Interfaz" },
  {
    key: "dynamic",
    label: "Dinámica",
    format: v => v ? <span className="text-amber-500">Sí</span> : <span className="text-neutral-400">No</span>,
  },
  {
    key: "disabled",
    label: "Deshabilitada",
    format: v => v ? <span className="text-red-500">Sí</span> : <span className="text-neutral-400">No</span>,
  },
  { key: "comment", label: "Comentario" },
]

export default function DireccionesPage() {
  return <RosSectionTable section="addresses" columns={columns} title="Direcciones IP configuradas" />
}