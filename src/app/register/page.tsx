"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const DOMINIO = "@recuperocrediticio.com.ar"

export default function RegisterPage() {
  const router = useRouter()
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [interno, setInterno] = useState("")
  const [cargo, setCargo] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!email.toLowerCase().endsWith(DOMINIO)) {
      setError(`El email debe ser del dominio ${DOMINIO}`)
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      setLoading(false)
      return
    }

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, apellido, interno, cargo, email, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || "Error al registrarse")
      setLoading(false)
      return
    }

    router.push("/login?registered=true")
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 before:absolute before:inset-0 before:bg-[url('/bg-code.jpg')] before:bg-cover before:bg-center before:opacity-20">
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900/60 via-navy-900/40 to-navy-900/60" />
      <div className="relative z-10 w-full max-w-md">
      <Card className="w-full p-6 space-y-6">
        <div className="flex flex-col items-center gap-2">
          <Building2 className="h-10 w-10 text-brand-600" />
          <h1 className="text-2xl font-bold">Crear cuenta</h1>
          <p className="text-sm text-neutral-500">Solo personal de Recupero Crediticio</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                placeholder="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido</Label>
              <Input
                id="apellido"
                placeholder="Apellido"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="interno">Interno</Label>
              <Input
                id="interno"
                placeholder="Interno"
                value={interno}
                onChange={(e) => setInterno(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo</Label>
              <Input
                id="cargo"
                placeholder="Cargo"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@recuperocrediticio.com.ar"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p className="text-xs text-neutral-400">
              Debe ser del dominio <span className="font-medium text-brand-600">@recuperocrediticio.com.ar</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
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
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repetir contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creando..." : "Crear cuenta"}
          </Button>
        </form>

          <div className="text-center text-sm text-neutral-500">
          ¿Ya tienes cuenta?{" "}
          <a href="/login" className="text-brand-600 hover:underline">
            Iniciar sesión
          </a>
        </div>
      </Card>
      </div>
    </div>
  )
}
