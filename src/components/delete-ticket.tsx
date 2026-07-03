"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface DeleteTicketProps {
  ticketId: string
  ticketTitulo: string
}

export function DeleteTicket({ ticketId, ticketTitulo }: DeleteTicketProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  async function handleDelete() {
    setDeleting(true)
    setError("")

    const res = await fetch(`/api/tickets/${ticketId}`, { method: "DELETE" })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Error al eliminar ticket")
      setDeleting(false)
      return
    }

    router.push("/tickets")
  }

  return (
    <div>
      {showConfirm ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="mb-3 text-sm text-red-700 dark:text-red-400">
            ¿Eliminar ticket <strong>“{ticketTitulo}”</strong>? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowConfirm(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
          </div>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowConfirm(true)}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
          Eliminar ticket
        </Button>
      )}
    </div>
  )
}
