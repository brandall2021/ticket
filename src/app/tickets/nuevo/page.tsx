"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"

interface Categoria {
  id: string
  nombre: string
  color: string
}

export default function NuevoTicketPage() {
  const router = useRouter()
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [prioridad, setPrioridad] = useState("MEDIA")
  const [categoriaId, setCategoriaId] = useState("")
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((session) => {
        if (!session?.user) {
          router.push("/login")
          return
        }
        fetch("/api/categorias")
          .then((res) => res.json())
          .then((data) => setCategorias(data))
          .finally(() => setLoading(false))
      })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo,
        descripcion,
        prioridad,
        categoriaId: categoriaId || null,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || "Error al crear ticket")
      setSubmitting(false)
      return
    }

    router.push(`/tickets/${data.id}`)
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-neutral-500">
        Cargando...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo Ticket</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Resumen del problema"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describe el problema en detalle..."
                rows={5}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prioridad">Prioridad</Label>
              <Select
                id="prioridad"
                value={prioridad}
                onChange={(e) => setPrioridad(e.target.value)}
              >
                <option value="BAJA">Baja</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
                <option value="CRITICA">Crítica</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Select
                id="categoria"
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
              >
                <option value="">Sin categoría</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </Select>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Creando..." : "Crear Ticket"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
