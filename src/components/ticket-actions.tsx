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
  const [showSolucion, setShowSolucion] = useState(false)
  const [solucion, setSolucion] = useState("")

  const nextStatuses = STATUS_TRANSITIONS[currentStatus] || []

  async function handleStatusChange(newStatus: string) {
    if (newStatus === "CERRADO") {
      setShowSolucion(true)
      return
    }

    await doStatusChange(newStatus)
  }

  async function doStatusChange(newStatus: string, solucionText?: string) {
    setLoading(newStatus)
    setError("")

    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: newStatus,
        ...(solucionText ? { solucion: solucionText } : {}),
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Error al cambiar estado")
      setLoading(null)
      return
    }

    setLoading(null)
    setShowSolucion(false)
    setSolucion("")
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

      {showSolucion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-navy-800">
            <h3 className="mb-4 text-lg font-semibold">Cerrar ticket</h3>
            <p className="mb-2 text-sm text-neutral-500">Describí la solución aplicada:</p>
            <textarea
              className="w-full rounded-md border border-neutral-300 p-3 text-sm dark:border-navy-600 dark:bg-navy-700"
              rows={4}
              value={solucion}
              onChange={(e) => setSolucion(e.target.value)}
              placeholder="Solución aplicada..."
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowSolucion(false)
                  setSolucion("")
                }}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={() => doStatusChange("CERRADO", solucion)}
                disabled={!solucion.trim() || loading !== null}
              >
                {loading === "CERRADO" ? "Cerrando..." : "Confirmar cierre"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
