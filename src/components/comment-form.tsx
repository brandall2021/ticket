"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { RichTextEditor } from "@/components/rich-text-editor"

interface CommentFormProps {
  ticketId: string
  userRole?: string
}

export function CommentForm({ ticketId, userRole }: CommentFormProps) {
  const router = useRouter()
  const [contenido, setContenido] = useState("")
  const [isInternal, setIsInternal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const canMarkInternal = userRole === "ADMIN" || userRole === "AGENT"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!contenido.trim()) return

    setSubmitting(true)

    await fetch(`/api/tickets/${ticketId}/comentarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contenido, internal: isInternal }),
    })

    setContenido("")
    setIsInternal(false)
    setSubmitting(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <RichTextEditor
        value={contenido}
        onChange={setContenido}
        placeholder="Escribe un comentario..."
        minHeight={120}
      />
      {canMarkInternal && (
        <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
          <input
            type="checkbox"
            checked={isInternal}
            onChange={(e) => setIsInternal(e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 text-amber-500 focus:ring-amber-400"
          />
          Nota interna (solo visible para agentes)
        </label>
      )}
      <Button type="submit" size="sm" disabled={submitting || !contenido.trim()}>
        {submitting ? "Enviando..." : "Comentar"}
      </Button>
    </form>
  )
}
