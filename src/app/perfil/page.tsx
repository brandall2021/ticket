"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { User, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function PerfilPage() {
  const router = useRouter()
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [interno, setInterno] = useState("")
  const [cargo, setCargo] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchPerfil()
  }, [])

  async function fetchPerfil() {
    const res = await fetch("/api/perfil")
    if (res.status === 401) {
      router.push("/login")
      return
    }
    const data = await res.json()
    setNombre(data.name || "")
    setApellido(data.apellido || "")
    setInterno(data.interno || "")
    setCargo(data.cargo || "")
    setEmail(data.email || "")
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess(false)

    const res = await fetch("/api/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nombre, apellido, interno }),
    })

    if (!res.ok) {
      setError("Error al guardar")
      setSaving(false)
      return
    }

    setSaving(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg space-y-6 p-6">
        <div className="mb-6 h-8 w-40 animate-pulse rounded bg-neutral-200 dark:bg-navy-700" />
        <div className="rounded-lg border border-neutral-200 p-6 dark:border-navy-700">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-full animate-pulse rounded bg-neutral-200 dark:bg-navy-700" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-navy-700 dark:text-brand-400">
          <User className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Mi Perfil</h1>
          <p className="text-sm text-neutral-500">{email}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editar información</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido</Label>
                <Input
                  id="apellido"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interno">Interno</Label>
              <Input
                id="interno"
                value={interno}
                onChange={(e) => setInterno(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo</Label>
              <Input id="cargo" value={cargo} disabled className="bg-neutral-100 dark:bg-navy-700" />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-600">Información actualizada correctamente</p>}

            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
