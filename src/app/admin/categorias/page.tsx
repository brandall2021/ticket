"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Circle, ToggleLeft, ToggleRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface Categoria {
  id: string
  nombre: string
  color: string
  activo: boolean
  createdAt: string
}

const colorOptions = [
  { label: "Azul", value: "#3B82F6" },
  { label: "Rojo", value: "#EF4444" },
  { label: "Verde", value: "#10B981" },
  { label: "Amarillo", value: "#F59E0B" },
  { label: "Púrpura", value: "#8B5CF6" },
  { label: "Rosa", value: "#EC4899" },
  { label: "Naranja", value: "#F97316" },
  { label: "Cian", value: "#06B6D4" },
]

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
  })
}

export default function AdminCategoriasPage() {
  const router = useRouter()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [nombre, setNombre] = useState("")
  const [color, setColor] = useState("#3B82F6")
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/admin/categorias")
      .then((res) => res.json())
      .then((data) => setCategorias(data))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError("")

    const res = await fetch("/api/admin/categorias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, color }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Error al crear categoría")
      setCreating(false)
      return
    }

    const nueva = await res.json()
    setCategorias((prev) => [...prev, nueva])
    setNombre("")
    setColor("#3B82F6")
    setCreating(false)
  }

  async function toggleActivo(cat: Categoria) {
    const res = await fetch(`/api/admin/categorias/${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !cat.activo }),
    })

    if (res.ok) {
      setCategorias((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, activo: !c.activo } : c))
      )
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-neutral-500">Cargando...</div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Categorías</h1>
        <Button variant="outline" size="sm" onClick={() => router.push("/admin")}>
          Volver
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nueva Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1 space-y-1">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre de la categoría"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Color</Label>
              <div className="flex gap-1">
                {colorOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setColor(opt.value)}
                    className="rounded-full p-1 transition-transform hover:scale-110"
                    title={opt.label}
                  >
                    <Circle
                      className="h-6 w-6"
                      style={{
                        fill: opt.value,
                        color: opt.value,
                        stroke: color === opt.value ? "#0f172a" : "transparent",
                        strokeWidth: color === opt.value ? 2 : 0,
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" disabled={creating}>
              <Plus className="h-4 w-4" />
              {creating ? "Creando..." : "Crear"}
            </Button>
          </form>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Categorías</CardTitle>
        </CardHeader>
        <CardContent>
          {categorias.length === 0 ? (
            <p className="text-sm text-neutral-500">No hay categorías</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-neutral-500 dark:border-navy-700">
                    <th className="pb-3 pr-4 font-medium">Nombre</th>
                    <th className="pb-3 pr-4 font-medium">Color</th>
                    <th className="pb-3 pr-4 font-medium">Estado</th>
                    <th className="pb-3 pr-4 font-medium">Creado</th>
                    <th className="pb-3 font-medium">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {categorias.map((cat) => (
                    <tr key={cat.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">{cat.nombre}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-4 w-4 rounded-full border"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="text-neutral-500">{cat.color}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={cat.activo ? "success" : "outline"}>
                          {cat.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="py-3 text-neutral-500">{formatDate(cat.createdAt)}</td>
                      <td className="py-3">
                        <button
                          type="button"
                          onClick={() => toggleActivo(cat)}
                          className="flex items-center gap-1 text-sm text-neutral-500 transition-colors hover:text-brand-600"
                          title={cat.activo ? "Dar de baja" : "Activar"}
                        >
                          {cat.activo ? (
                            <ToggleRight className="h-5 w-5 text-green-500" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-neutral-400" />
                          )}
                          {cat.activo ? "Dar de baja" : "Activar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
