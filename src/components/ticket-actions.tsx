"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

const validTransitions: Record<string, string[]> = {
  NUEVO: ["ASIGNADO"],
  ASIGNADO: ["EN_PROGRESO"],
  EN_PROGRESO: ["RESUELTO"],
  RESUELTO: ["CERRADO"],
  CERRADO: ["REABIERTO"],
  REABIERTO: ["ASIGNADO"],
}

const statusLabels: Record<string, string> = {
  NUEVO: "Nuevo",
  ASIGNADO: "Asignado",
  EN_PROGRESO: "En Progreso",
  RESUELTO: "Resuelto",
  CERRADO: "Cerrado",
  REABIERTO: "Reabierto",
}

interface TicketActionsProps {
  ticketId: string
  currentStatus: string
}

export function TicketActions({ ticketId, currentStatus }: TicketActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const nextStatuses = validTransitions[currentStatus] || []

  async function handleStatusChange(newStatus: string) {
    setLoading(newStatus)

    await fetch(`/api/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })

    setLoading(null)
    router.refresh()
  }

  if (nextStatuses.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {nextStatuses.map((status) => (
        <Button
          key={status}
          variant="outline"
          size="sm"
          onClick={() => handleStatusChange(status)}
          disabled={loading !== null}
        >
          {loading === status ? "..." : `→ ${statusLabels[status] || status}`}
        </Button>
      ))}
    </div>
  )
}
