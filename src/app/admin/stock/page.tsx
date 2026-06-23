"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Package, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Categoria {
  id: string
  nombre: string
  color: string
  icono: string
}

interface StockItem {
  id: string
  nombre: string
  cantidad: number
  categoriaId: string
  categoria: Categoria
  createdAt: string
  updatedAt: string
}

export default function AdminStockPage() {
  const router = useRouter()
  const [items, setItems] = useState<StockItem[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)

  const [categoriaId, setCategoriaId] = useState("")
  const [nombre, setNombre] = useState("")
  const [cantidad, setCantidad] = useState("1")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")

  const [showCatForm, setShowCatForm] = useState(false)
  const [catNombre, setCatNombre] = useState("")
  const [catColor, setCatColor] = useState("#3b82f6")
  const [creandoCat, setCreandoCat] = useState(false)
  const [catError, setCatError] = useState("")

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const [itemsRes, catsRes] = await Promise.all([
      fetch("/api/admin/stock"),
      fetch("/api/admin/stock-categorias"),
    ])
    setItems(await itemsRes.json())
    setCategorias(await catsRes.json())
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError("")

    const res = await fetch("/api/admin/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoriaId, nombre, cantidad: parseInt(cantidad) || 0 }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Error al crear item")
      setCreating(false)
      return
    }

    setNombre("")
    setCantidad("1")
    setCreating(false)
    fetchAll()
  }

  async function updateCantidad(item: StockItem, newCantidad: number) {
    if (newCantidad < 0) newCantidad = 0
    const res = await fetch(`/api/admin/stock/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cantidad: newCantidad }),
    })
    if (res.ok) {
      const updated = await res.json()
      setItems(prev => prev.map(i => i.id === updated.id ? updated : i))
    }
  }

  async function deleteItem(id: string) {
    if (!confirm("¿Eliminar este item?")) return
    const res = await fetch(`/api/admin/stock/${id}`, { method: "DELETE" })
    if (res.ok) {
      setItems(prev => prev.filter(i => i.id !== id))
    }
  }

  async function handleCreateCat(e: React.FormEvent) {
    e.preventDefault()
    setCreandoCat(true)
    setCatError("")

    const res = await fetch("/api/admin/stock-categorias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: catNombre, color: catColor }),
    })

    if (!res.ok) {
      const data = await res.json()
      setCatError(data.error || "Error al crear categoría")
      setCreandoCat(false)
      return
    }

    setCatNombre("")
    setCatColor("#3b82f6")
    setCreandoCat(false)
    setShowCatForm(false)
    fetchAll()
  }

  async function deleteCategoria(id: string) {
    const res = await fetch(`/api/admin/stock-categorias/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error || "Error al eliminar")
      return
    }
    fetchAll()
  }

  const agrupados = items.reduce<Record<string, StockItem[]>>((acc, item) => {
    const key = item.categoria?.id || "sin-categoria"
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  if (loading) {
    return <div className="mx-auto max-w-5xl p-6 text-neutral-500">Cargando...</div>
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Stock</h1>
        <Button variant="outline" size="sm" onClick={() => router.push("/admin")}>
          Volver
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Agregar Item</CardTitle>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowCatForm(!showCatForm)}>
              <Settings className="h-4 w-4" />
              Categorías
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showCatForm && (
            <form onSubmit={handleCreateCat} className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 space-y-3 dark:border-navy-600 dark:bg-navy-700/50">
              <h4 className="font-medium text-sm">Nueva categoría</h4>
              {catError && <p className="text-sm text-red-500">{catError}</p>}
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[160px] space-y-1">
                  <Label htmlFor="catNombre">Nombre</Label>
                  <Input id="catNombre" value={catNombre} onChange={e => setCatNombre(e.target.value)} placeholder="Ej: Tóner, Mouse..." required />
                </div>
                <div className="w-20 space-y-1">
                  <Label htmlFor="catColor">Color</Label>
                  <input id="catColor" type="color" value={catColor} onChange={e => setCatColor(e.target.value)} className="h-9 w-full rounded-md border border-neutral-300 bg-white p-0.5 dark:border-navy-500 dark:bg-navy-800" />
                </div>
                <Button type="submit" size="sm" disabled={creandoCat}>
                  {creandoCat ? "..." : "Crear"}
                </Button>
              </div>
              {categorias.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-200 dark:border-navy-600">
                  {categorias.map(cat => (
                    <div key={cat.id} className="flex items-center gap-1 rounded-full border px-3 py-1 text-xs" style={{ borderColor: cat.color, color: cat.color }}>
                      {cat.nombre}
                      <button onClick={() => deleteCategoria(cat.id)} className="ml-1 hover:text-red-500">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </form>
          )}

          <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
            <div className="w-40 space-y-1">
              <Label htmlFor="categoria">Categoría</Label>
              <select
                id="categoria"
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm dark:border-navy-500 dark:bg-navy-800 dark:text-neutral-100"
                required
              >
                <option value="">Seleccionar...</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
            </div>
            <div className="min-w-[200px] flex-1 space-y-1">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Tóner HP 12A" required />
            </div>
            <div className="w-24 space-y-1">
              <Label htmlFor="cantidad">Cantidad</Label>
              <Input id="cantidad" type="number" min="0" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
            </div>
            <Button type="submit" disabled={creating}>
              <Plus className="h-4 w-4" />
              {creating ? "Agregando..." : "Agregar"}
            </Button>
          </form>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </CardContent>
      </Card>

      {categorias.map(cat => {
        const catItems = agrupados[cat.id] || []
        const total = catItems.reduce((sum, i) => sum + i.cantidad, 0)

        return (
          <Card key={cat.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" style={{ color: cat.color }} />
                {cat.nombre}
                <span className="ml-auto text-sm font-normal text-neutral-500">
                  Total: {total}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {catItems.length === 0 ? (
                <p className="text-sm text-neutral-500">Sin items</p>
              ) : (
                <div className="space-y-2">
                  {catItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-navy-600 dark:bg-navy-700/50"
                    >
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-neutral-400" />
                        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{item.nombre}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => updateCantidad(item, item.cantidad - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-300 text-neutral-600 transition-colors hover:bg-neutral-200 dark:border-navy-500 dark:text-neutral-300 dark:hover:bg-navy-600"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                          {item.cantidad}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCantidad(item, item.cantidad + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-300 text-neutral-600 transition-colors hover:bg-neutral-200 dark:border-navy-500 dark:text-neutral-300 dark:hover:bg-navy-600"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteItem(item.id)}
                          className="ml-2 text-neutral-400 transition-colors hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      {categorias.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-neutral-500">
            No hay categorías de stock. Creá una usando el botón "Categorías".
          </CardContent>
        </Card>
      )}
    </div>
  )
}
