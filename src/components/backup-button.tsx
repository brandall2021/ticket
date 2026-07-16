"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Database, Loader2, Check, AlertCircle } from "lucide-react"

export function BackupButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle")
  const [msg, setMsg] = useState("")

  async function handleBackup() {
    setStatus("loading")
    setMsg("")
    try {
      const res = await fetch("/api/admin/backup", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setStatus("ok")
        setMsg(`Backup enviado a cpereyra@face.unt.edu.ar — ${data.stats.users} usuarios, ${data.stats.tickets} tickets, ${data.stats.instructivos} instructivos`)
      } else {
        setStatus("error")
        setMsg(data.error || "Error al generar backup")
      }
    } catch {
      setStatus("error")
      setMsg("Error de conexión")
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleBackup}
        disabled={status === "loading"}
      >
        {status === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : status === "ok" ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : status === "error" ? (
          <AlertCircle className="h-4 w-4 text-red-500" />
        ) : (
          <Database className="h-4 w-4" />
        )}
        Backup DB
      </Button>
      {msg && (
        <span className={`text-xs ${status === "ok" ? "text-green-600" : status === "error" ? "text-red-500" : "text-neutral-500"}`}>
          {msg}
        </span>
      )}
    </div>
  )
}
