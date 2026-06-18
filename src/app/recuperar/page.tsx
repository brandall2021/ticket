"use client"

import { useState } from "react"
import { Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RecuperarPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    await fetch("/api/auth/recuperar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm p-6 text-center space-y-4">
          <Mail className="h-10 w-10 text-brand-600 mx-auto" />
          <h1 className="text-2xl font-bold">Revisa tu correo</h1>
          <p className="text-sm text-neutral-500">
            Si la cuenta existe, recibirás un enlace para restablecer tu contraseña.
          </p>
          <Button variant="outline" onClick={() => setSent(false)}>
            Reenviar
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm p-6 space-y-6">
        <div className="flex flex-col items-center gap-2">
          <Mail className="h-10 w-10 text-brand-600" />
          <h1 className="text-2xl font-bold">Recuperar contraseña</h1>
          <p className="text-sm text-neutral-500 text-center">
            Te enviaremos un enlace para restablecer tu contraseña.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Enviando..." : "Enviar enlace"}
          </Button>
        </form>

        <div className="text-center text-sm text-neutral-500">
          <a href="/login" className="text-brand-600 hover:underline">
            Volver al inicio de sesión
          </a>
        </div>
      </Card>
    </div>
  )
}
