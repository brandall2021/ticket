"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Printer, Mouse, Keyboard, Power, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"

interface StockItem {
  id: string
  tipo: string
  nombre: string
  cantidad: number
  createdAt: string
  updatedAt: string
}

const tipoConfig: Record<string, { label: string; icon: typeof Printer; color: string }> = {
  TONER: { label: "Tóner", icon: Printer, color: "text-blue-600 dark:text-blue-400" },
  MOUSE: { label: "Mouse", icon: Mouse, color: "text-green-600 dark:text-green-400" },
  TECLADO: { label: "Teclado", icon: Keyboard, color: "text-purple-600 dark:text-purple-400" },
  FUENTE: { label: "Fuente", icon: Power, color: "text-orange-600 dark:text-orange-400" },
}

export default function AdminStockPage() {
  const router = useRouter()
  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)

  const [tipo, setTipo] = useState("TONER")
  const [nombre, setNombre] = useState("")
  const [cantidad, setCantidad] = useState("1")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    const res = await fetch("/api/admin/stock")
    const data = await res.json()
    setItems(data)
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError("")

    const res = await fetch("/api/admin/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, nombre, cantidad: parseInt(cantidad) || 0 }),
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
    fetchItems()
  }

  async function updateCantidad(item: StockItem, newCantidad: number) {
    if (newCantidad < 0) newCantidad = 0
    await fetch(`/api/admin/stock/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cantidad: newCantidad }),
    })
    fetchItems()
  }

  async function deleteItem(id: string) {
    if (!confirm("¿Eliminar este item?")) return
    await fetch(`/api/admin/stock/${id}`, { method: "DELETE" })
    fetchItems()
  }

  const agrupados = items.reduce<Record<string, StockItem[]>>((acc, item) => {
    if (!acc[item.tipo]) acc[item.tipo] = []
    acc[item.tipo].push(item)
    return acc
  }, {})

  if (loading) {
    return <div className="mx-auto max-w-5xl p-6 text-neutral-500 dark:text-neutral-400">Cargando...</div>
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
        <CardHeader>
          <CardTitle>Agregar Item</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
            <div className="w-32 space-y-1">
              <Label htmlFor="tipo">Tipo</Label>
              <Select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="TONER">Tóner</option>
                <option value="MOUSE">Mouse</option>
                <option value="TECLADO">Teclado</option>
                <option value="FUENTE">Fuente</option>
              </Select>
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
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </CardContent>
      </Card>

      {Object.entries(tipoConfig).map(([tipoKey, cfg]) => {
        const tipoItems = agrupados[tipoKey] || []
        const Icon = cfg.icon
        const total = tipoItems.reduce((sum, i) => sum + i.cantidad, 0)

        return (
          <Card key={tipoKey}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className={`h-5 w-5 ${cfg.color}`} />
                {cfg.label}
                <span className="ml-auto text-sm font-normal text-neutral-500 dark:text-neutral-400">
                  Total: {total}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tipoItems.length === 0 ? (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Sin items</p>
              ) : (
                <div className="space-y-2">
                  {tipoItems.map((item) => (
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
    </div>
  )
}
