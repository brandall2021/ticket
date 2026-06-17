"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface CommentFormProps {
  ticketId: string
}

export function CommentForm({ ticketId }: CommentFormProps) {
  const router = useRouter()
  const [contenido, setContenido] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!contenido.trim()) return

    setSubmitting(true)

    await fetch(`/api/tickets/${ticketId}/comentarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contenido }),
    })

    setContenido("")
    setSubmitting(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
        placeholder="Escribe un comentario..."
        rows={3}
        required
      />
      <Button type="submit" size="sm" disabled={submitting || !contenido.trim()}>
        {submitting ? "Enviando..." : "Comentar"}
      </Button>
    </form>
  )
}
