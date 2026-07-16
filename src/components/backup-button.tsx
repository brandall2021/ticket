"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Database, Loader2, Check, AlertCircle, Download, Mail } from "lucide-react"

export function BackupButton() {
  const [status, setStatus] = useState<"idle" | "loading-download" | "loading-email" | "ok-download" | "ok-email" | "error">("idle")
  const [msg, setMsg] = useState("")

  async function handleDownload() {
    setStatus("loading-download")
    setMsg("")
    try {
      const res = await fetch("/api/admin/backup", { method: "GET" })
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = res.headers.get("Content-Disposition")?.match(/filename="(.*)"/)?.[1] || "backup.sql"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setStatus("ok-download")
        setMsg("Descargado correctamente")
        setTimeout(() => setStatus("idle"), 3000)
      } else {
        setStatus("error")
        setMsg("Error al descargar")
      }
    } catch {
      setStatus("error")
      setMsg("Error de conexión")
    }
  }

  async function handleEmail() {
    setStatus("loading-email")
    setMsg("")
    try {
      const res = await fetch("/api/admin/backup", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setStatus("ok-email")
        setMsg(`Enviado a cpereyra@face.unt.edu.ar`)
        setTimeout(() => setStatus("idle"), 3000)
      } else {
        setStatus("error")
        setMsg(data.error || "Error al enviar")
      }
    } catch {
      setStatus("error")
      setMsg("Error de conexión")
    }
  }

  const isDownloadLoading = status === "loading-download"
  const isEmailLoading = status === "loading-email"

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={handleDownload} disabled={isDownloadLoading || isEmailLoading}>
          {isDownloadLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : status === "ok-download" ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Descargar
        </Button>
        <Button variant="outline" size="sm" onClick={handleEmail} disabled={isDownloadLoading || isEmailLoading}>
          {isEmailLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : status === "ok-email" ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          Enviar por correo
        </Button>
      </div>
      {msg && (
        <span className={`text-xs ${status.startsWith("ok") ? "text-green-600" : status === "error" ? "text-red-500" : "text-neutral-500"}`}>
          {msg}
        </span>
      )}
    </div>
  )
}
