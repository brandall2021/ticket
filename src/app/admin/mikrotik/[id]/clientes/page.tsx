"use client"

import RosSectionTable, { type Column } from "@/components/mikrotik/ros-section-table"

const columns: Column[] = [
  { key: "address", label: "Dirección" },
  { key: "macAddress", label: "MAC" },
  { key: "interface", label: "Interfaz" },
  {
    key: "dynamic",
    label: "Dinámica",
    format: v => v ? <span className="text-amber-500">Sí</span> : <span className="text-neutral-400">No</span>,
  },
  {
    key: "complete",
    label: "Completa",
    format: v => v ? <span className="text-green-500">Sí</span> : <span className="text-neutral-400">No</span>,
  },
]

export default function ClientesPage() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-600">
        Tabla ARP: dispositivos vistos en la red L2 por el router. Útil para saber qué clientes están conectados
        (IP + MAC + interfaz).
      </div>
      <RosSectionTable section="arp" columns={columns} title="Clientes conectados (ARP)" />
    </div>
  )
}