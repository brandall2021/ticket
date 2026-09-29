"use client"

import RosSectionTable, { type Column } from "@/components/mikrotik/ros-section-table"

const columns: Column[] = [
  { key: "dstAddress", label: "Destino" },
  { key: "gateway", label: "Gateway" },
  { key: "interface", label: "Interfaz" },
  { key: "distance", label: "Distancia" },
  { key: "routingTable", label: "Tabla" },
  {
    key: "active",
    label: "Activa",
    format: v => v ? <span className="text-green-500">Sí</span> : <span className="text-red-500">No</span>,
  },
  {
    key: "dynamic",
    label: "Dinámica",
    format: v => v ? <span className="text-amber-500">Sí</span> : <span className="text-neutral-400">No</span>,
  },
  { key: "comment", label: "Comentario" },
]

export default function RutasPage() {
  return <RosSectionTable section="routes" columns={columns} title="Rutas IP" />
}