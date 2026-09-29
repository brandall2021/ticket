"use client"

import RosSectionTable, { type Column } from "@/components/mikrotik/ros-section-table"

const columns: Column[] = [
  { key: "address", label: "Dirección" },
  { key: "macAddress", label: "MAC" },
  { key: "hostName", label: "Hostname" },
  { key: "server", label: "Servidor" },
  {
    key: "status",
    label: "Estado",
    format: v => {
      const s = String(v || "")
      const color = s.includes("bound") ? "text-green-500" : s.toLowerCase().includes("offering") ? "text-amber-500" : "text-neutral-400"
      return <span className={color}>{s || "—"}</span>
    },
  },
  { key: "expiresAfter", label: "Expira en" },
  { key: "activeAddress", label: "Dirección activa" },
  {
    key: "dynamic",
    label: "Dinámica",
    format: v => v ? <span className="text-amber-500">Sí</span> : <span className="text-neutral-400">No</span>,
  },
]

export default function DhcpPage() {
  return <RosSectionTable section="dhcp" columns={columns} title="DHCP Leases" />
}