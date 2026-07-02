"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { STATUS_TRANSITIONS, STATUS_LABELS } from "@/lib/constants"

interface TicketActionsProps {
  ticketId: string
  currentStatus: string
}

export function TicketActions({ ticketId, currentStatus }: TicketActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState("")

  const nextStatuses = STATUS_TRANSITIONS[currentStatus] || []

  async function handleStatusChange(newStatus: string) {
    setLoading(newStatus)
    setError("")

    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Error al cambiar estado")
      setLoading(null)
      return
    }

    setLoading(null)
    router.refresh()
  }

  if (nextStatuses.length === 0) return null

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {nextStatuses.map((status) => (
          <Button
            key={status}
            variant="outline"
            size="sm"
            onClick={() => handleStatusChange(status)}
            disabled={loading !== null}
          >
            {loading === status ? "..." : `→ ${STATUS_LABELS[status] || status}`}
          </Button>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  )
}