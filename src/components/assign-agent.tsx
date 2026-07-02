"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"

interface Agent {
  id: string
  name: string
  email: string
  role: string
}

interface AssignAgentProps {
  ticketId: string
  currentAgentId: string | null
}

export function AssignAgent({ ticketId, currentAgentId }: AssignAgentProps) {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [agentId, setAgentId] = useState(currentAgentId || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/admin/usuarios")
      .then((res) => res.json())
      .then((data) => setAgents(data.filter((u: Agent) => u.role === "AGENT" || u.role === "ADMIN")))
      .catch(() => setError("Error al cargar agentes"))
  }, [])

  async function handleAssign() {
    if (!agentId) return
    setLoading(true)
    setError("")

    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agenteId: agentId }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Error al asignar")
      setLoading(false)
      return
    }

    setLoading(false)
    router.refresh()
  }

  async function handleUnassign() {
    setLoading(true)
    setError("")

    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agenteId: null }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Error al desasignar")
      setLoading(false)
      return
    }

    setAgentId("")
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={agentId} onChange={(e) => setAgentId(e.target.value)} className="w-48">
        <option value="">Seleccionar agente...</option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.name}
          </option>
        ))}
      </Select>
      <Button variant="outline" size="sm" onClick={handleAssign} disabled={loading || !agentId}>
        {loading ? "..." : "Asignar"}
      </Button>
      {currentAgentId && (
        <Button variant="ghost" size="sm" onClick={handleUnassign} disabled={loading}>
          Desasignar
        </Button>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}