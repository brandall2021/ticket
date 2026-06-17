"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RestablecerPage({
  params,
}: {
  params: { token: string }
}) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password !== confirm) {
      setError("Las contraseñas no coinciden")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      setLoading(false)
      return
    }

    const res = await fetch("/api/auth/restablecer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: params.token, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || "Error al restablecer la contraseña")
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push("/login"), 2000)
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm p-6 text-center space-y-4">
          <Lock className="h-10 w-10 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold">Contraseña actualizada</h1>
          <p className="text-sm text-muted-foreground">
            Redirigiendo al inicio de sesión...
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm p-6 space-y-6">
        <div className="flex flex-col items-center gap-2">
          <Lock className="h-10 w-10 text-primary" />
          <h1 className="text-2xl font-bold">Nueva contraseña</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nueva contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Confirmar contraseña</Label>
            <Input
              id="confirm"
              type="password"
              placeholder="Repite la contraseña"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Guardando..." : "Restablecer contraseña"}
          </Button>
        </form>
      </Card>
    </div>
  )
}
