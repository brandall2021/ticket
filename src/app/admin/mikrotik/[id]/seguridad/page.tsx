"use client"

import { useState } from "react"
import RosSectionTable, { type Column } from "@/components/mikrotik/ros-section-table"

const firewallColumns: Column[] = [
  { key: "chain", label: "Chain" },
  { key: "action", label: "Acción" },
  { key: "protocol", label: "Protocolo" },
  { key: "srcAddress", label: "Origen" },
  { key: "dstAddress", label: "Destino" },
  { key: "srcPort", label: "Puerto Orig." },
  { key: "dstPort", label: "Puerto Dest." },
  { key: "inInterface", label: "In Interface" },
  { key: "outInterface", label: "Out Interface" },
  { key: "connectionState", label: "Conn. State" },
  { key: "comment", label: "Comentario" },
  {
    key: "disabled",
    label: "Estado",
    format: v => v
      ? <span className="rounded-full bg-neutral-500/10 px-2 py-0.5 text-xs text-neutral-500">Disabled</span>
      : <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-500">Activa</span>,
  },
]

const natColumns: Column[] = [
  { key: "chain", label: "Chain" },
  { key: "action", label: "Acción" },
  { key: "protocol", label: "Protocolo" },
  { key: "dstAddress", label: "Destino" },
  { key: "dstPort", label: "Puerto Dest." },
  { key: "inInterface", label: "In Interface" },
  { key: "outInterface", label: "Out Interface" },
  { key: "comment", label: "Comentario" },
  {
    key: "disabled",
    label: "Estado",
    format: v => v
      ? <span className="rounded-full bg-neutral-500/10 px-2 py-0.5 text-xs text-neutral-500">Disabled</span>
      : <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-500">Activa</span>,
  },
]

export default function SeguridadPage() {
  const [tab, setTab] = useState<"firewall" | "nat">("firewall")

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 rounded-xl border border-neutral-200 bg-white p-1 dark:border-neutral-700/50 dark:bg-neutral-800/50">
        <TabButton active={tab === "firewall"} onClick={() => setTab("firewall")}>Firewall Filter</TabButton>
        <TabButton active={tab === "nat"} onClick={() => setTab("nat")}>NAT</TabButton>
      </div>

      {tab === "firewall"
        ? <RosSectionTable section="firewall" columns={firewallColumns} title="Reglas de Firewall (filter)" />
        : <RosSectionTable section="nat" columns={natColumns} title="Reglas NAT" />}
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
        active
          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
          : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700/50 dark:hover:text-neutral-100"
      }`}
    >
      {children}
    </button>
  )
}