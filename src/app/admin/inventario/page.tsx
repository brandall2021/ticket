"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Pencil, Search, Settings, Package, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface TipoEquipo {
  id: string
  nombre: string
  color: string
  activo: boolean
}

interface EstadoEquipo {
  id: string
  nombre: string
  color: string
  activo: boolean
}

interface Equipo {
  id: string
  nroInventario: string
  marca: string
  modelo: string
  serie?: string | null
  ubicacion?: string | null
  ipPc?: string | null
  tipo: TipoEquipo
  estado: EstadoEquipo
}

export default function AdminInventarioPage() {
  const router = useRouter()
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [tipos, setTipos] = useState<TipoEquipo[]>([])
  const [estados, setEstados] = useState<EstadoEquipo[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [error, setError] = useState("")

  const [tipoId, setTipoId] = useState("")
  const [estadoId, setEstadoId] = useState("")
  const [nroInventario, setNroInventario] = useState("")
  const [marca, setMarca] = useState("")
  const [modelo, setModelo] = useState("")
  const [serie, setSerie] = useState("")
  const [ubicacion, setUbicacion] = useState("")
  const [ipPc, setIpPc] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const [showTipos, setShowTipos] = useState(false)
  const [tipoNombre, setTipoNombre] = useState("")
  const [tipoColor, setTipoColor] = useState("#3b82f6")
  const [tipoError, setTipoError] = useState("")

  const [showEstados, setShowEstados] = useState(false)
  const [estadoNombre, setEstadoNombre] = useState("")
  const [estadoColor, setEstadoColor] = useState("#22c55e")
  const [estadoError, setEstadoError] = useState("")

  useEffect(() => { fetchAll() }, [])

  useEffect(() => {
    const t = setTimeout(() => { fetchEquipos() }, 300)
    return () => clearTimeout(t)
  }, [q])

  async function fetchAll() {
    const [eqRes, tiposRes, estadosRes] = await Promise.all([
      fetch("/api/admin/inventario"),
      fetch("/api/admin/inventario-tipos"),
      fetch("/api/admin/inventario-estados"),
    ])
    setEquipos(await eqRes.json())
    setTipos(await tiposRes.json())
    setEstados(await estadosRes.json())
    setLoading(false)
  }

  async function fetchEquipos() {
    const url = q ? `/api/admin/inventario?q=${encodeURIComponent(q)}` : "/api/admin/inventario"
    const res = await fetch(url)
    if (res.ok) setEquipos(await res.json())
  }

  async function createEquipo(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError("")

    const res = await fetch(editingId ? `/api/admin/inventario/${editingId}` : "/api/admin/inventario", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipoId,
        estadoId,
        nroInventario,
        marca,
        modelo,
        serie,
        ubicacion,
        ipPc,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Error al guardar equipo")
      setGuardando(false)
      return
    }

    resetForm()
    fetchAll()
  }

  function resetForm() {
    setEditingId(null)
    setTipoId("")
    setEstadoId("")
    setNroInventario("")
    setMarca("")
    setModelo("")
    setSerie("")
    setUbicacion("")
    setIpPc("")
    setError("")
  }

  function startEdit(eq: Equipo) {
    setEditingId(eq.id)
    setTipoId(eq.tipo.id)
    setEstadoId(eq.estado.id)
    setNroInventario(eq.nroInventario)
    setMarca(eq.marca)
    setModelo(eq.modelo)
    setSerie(eq.serie || "")
    setUbicacion(eq.ubicacion || "")
    setIpPc(eq.ipPc || "")
    setError("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function deleteEquipo(id: string) {
    if (!confirm("¿Eliminar este equipo del inventario?")) return
    const res = await fetch(`/api/admin/inventario/${id}`, { method: "DELETE" })
    if (res.ok) {
      if (editingId === id) resetForm()
      fetchAll()
    }
  }

  async function createTipo(e: React.FormEvent) {
    e.preventDefault()
    setTipoError("")
    const res = await fetch("/api/admin/inventario-tipos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: tipoNombre, color: tipoColor }),
    })
    if (!res.ok) {
      const data = await res.json()
      setTipoError(data.error || "Error al crear tipo")
      return
    }
    setTipoNombre("")
    setTipoColor("#3b82f6")
    setShowTipos(false)
    fetchAll()
  }

  async function deleteTipo(id: string) {
    const res = await fetch(`/api/admin/inventario-tipos/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error || "Error al eliminar")
      return
    }
    fetchAll()
  }

  async function createEstado(e: React.FormEvent) {
    e.preventDefault()
    setEstadoError("")
    const res = await fetch("/api/admin/inventario-estados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: estadoNombre, color: estadoColor }),
    })
    if (!res.ok) {
      const data = await res.json()
      setEstadoError(data.error || "Error al crear estado")
      return
    }
    setEstadoNombre("")
    setEstadoColor("#22c55e")
    setShowEstados(false)
    fetchAll()
  }

  async function deleteEstado(id: string) {
    const res = await fetch(`/api/admin/inventario-estados/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error || "Error al eliminar")
      return
    }
    fetchAll()
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="mb-6 h-8 w-40 animate-pulse rounded bg-neutral-200 dark:bg-navy-700" />
        <div className="rounded-lg border border-neutral-200 p-6 dark:border-navy-700">
          <div className="mb-4 h-6 w-40 animate-pulse rounded bg-neutral-200 dark:bg-navy-700" />
          <div className="h-10 w-full animate-pulse rounded bg-neutral-200 dark:bg-navy-700" />
        </div>
        <div className="mt-6 rounded-lg border border-neutral-200 p-6 dark:border-navy-700">
          <div className="h-8 w-full animate-pulse rounded bg-neutral-200 dark:bg-navy-700" />
        </div>
      </div>
    )
  }

  const selectCls = "flex h-9 w-full rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm dark:border-navy-500 dark:bg-navy-800 dark:text-neutral-100"

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Inventario</h1>
        <Button variant="outline" size="sm" onClick={() => router.push("/admin")}>
          Volver
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{editingId ? "Editar Equipo" : "Agregar Equipo"}</CardTitle>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowTipos(!showTipos)}>
              <Settings className="h-4 w-4" />
              Tipos
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowEstados(!showEstados)}>
              <Activity className="h-4 w-4" />
              Estados
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showTipos && (
            <form onSubmit={createTipo} className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 space-y-3 dark:border-navy-600 dark:bg-navy-700/50">
              <h4 className="font-medium text-sm">Nuevo tipo</h4>
              {tipoError && <p className="text-sm text-red-500">{tipoError}</p>}
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[160px] space-y-1">
                  <Label htmlFor="tipoNombre">Nombre</Label>
                  <Input id="tipoNombre" value={tipoNombre} onChange={e => setTipoNombre(e.target.value)} placeholder="Ej: Notebook, Monitor..." required />
                </div>
                <div className="w-20 space-y-1">
                  <Label htmlFor="tipoColor">Color</Label>
                  <input id="tipoColor" type="color" value={tipoColor} onChange={e => setTipoColor(e.target.value)} className="h-9 w-full rounded-md border border-neutral-300 bg-white p-0.5 dark:border-navy-500 dark:bg-navy-800" />
                </div>
                <Button type="submit" size="sm">Crear</Button>
              </div>
              {tipos.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-200 dark:border-navy-600">
                  {tipos.map(t => (
                    <div key={t.id} className="flex items-center gap-1 rounded-full border px-3 py-1 text-xs" style={{ borderColor: t.color, color: t.color }}>
                      {t.nombre}
                      <button type="button" onClick={() => deleteTipo(t.id)} className="ml-1 hover:text-red-500">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </form>
          )}

          {showEstados && (
            <form onSubmit={createEstado} className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 space-y-3 dark:border-navy-600 dark:bg-navy-700/50">
              <h4 className="font-medium text-sm">Nuevo estado</h4>
              {estadoError && <p className="text-sm text-red-500">{estadoError}</p>}
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[160px] space-y-1">
                  <Label htmlFor="estadoNombre">Nombre</Label>
                  <Input id="estadoNombre" value={estadoNombre} onChange={e => setEstadoNombre(e.target.value)} placeholder="Ej: EN_TRANSLADO, EN_GARANTIA..." required />
                </div>
                <div className="w-20 space-y-1">
                  <Label htmlFor="estadoColor">Color</Label>
                  <input id="estadoColor" type="color" value={estadoColor} onChange={e => setEstadoColor(e.target.value)} className="h-9 w-full rounded-md border border-neutral-300 bg-white p-0.5 dark:border-navy-500 dark:bg-navy-800" />
                </div>
                <Button type="submit" size="sm">Crear</Button>
              </div>
              {estados.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-200 dark:border-navy-600">
                  {estados.map(s => (
                    <div key={s.id} className="flex items-center gap-1 rounded-full border px-3 py-1 text-xs" style={{ borderColor: s.color, color: s.color }}>
                      {s.nombre}
                      <button type="button" onClick={() => deleteEstado(s.id)} className="ml-1 hover:text-red-500">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </form>
          )}

          <form onSubmit={createEquipo} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <Label htmlFor="tipo">Tipo</Label>
                <select id="tipo" value={tipoId} onChange={e => setTipoId(e.target.value)} className={selectCls} required>
                  <option value="">Seleccionar...</option>
                  {tipos.map(t => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="estado">Estado</Label>
                <select id="estado" value={estadoId} onChange={e => setEstadoId(e.target.value)} className={selectCls} required>
                  <option value="">Seleccionar...</option>
                  {estados.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="nroInventario">N° Inventario</Label>
                <Input id="nroInventario" value={nroInventario} onChange={e => setNroInventario(e.target.value)} placeholder="Ej: PC-0001" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="marca">Marca</Label>
                <Input id="marca" value={marca} onChange={e => setMarca(e.target.value)} placeholder="Ej: HP" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="modelo">Modelo</Label>
                <Input id="modelo" value={modelo} onChange={e => setModelo(e.target.value)} placeholder="Ej: ProDesk 400" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="serie">Serie</Label>
                <Input id="serie" value={serie} onChange={e => setSerie(e.target.value)} placeholder="Opcional" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ubicacion">Ubicación</Label>
                <Input id="ubicacion" value={ubicacion} onChange={e => setUbicacion(e.target.value)} placeholder="Ej: Oficina 3" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ipPc">IP de red</Label>
                <Input id="ipPc" value={ipPc} onChange={e => setIpPc(e.target.value)} placeholder="Opcional" />
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={guardando}>
                <Plus className="h-4 w-4" />
                {guardando ? "Guardando..." : editingId ? "Guardar cambios" : "Agregar"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                  Cancelar edición
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar por marca, modelo, serie, N° inventario, ubicación o IP..."
            className="pl-9"
          />
        </div>
        <span className="text-sm text-neutral-500">{equipos.length} equipo(s)</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Equipos registrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {equipos.length === 0 ? (
            <p className="py-8 text-center text-neutral-500">No hay equipos registrados{ q ? " para esa búsqueda" : "" }.</p>
          ) : (
            <div className="space-y-2">
              {equipos.map(eq => (
                <div
                  key={eq.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-navy-600 dark:bg-navy-700/50"
                >
                  <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
                    <span
                      className="rounded-full border px-2.5 py-0.5 text-xs font-medium"
                      style={{ borderColor: eq.tipo.color, color: eq.tipo.color }}
                    >
                      {eq.tipo.nombre}
                    </span>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {eq.marca} {eq.modelo}
                    </span>
                    <span className="text-sm text-neutral-500">N°: {eq.nroInventario}</span>
                    {eq.serie && <span className="text-sm text-neutral-500">Serie: {eq.serie}</span>}
                    {eq.ubicacion && <span className="text-sm text-neutral-500">Ubic: {eq.ubicacion}</span>}
                    {eq.ipPc && <span className="text-sm text-neutral-500">IP: {eq.ipPc}</span>}
                    <span
                      className="rounded-full border px-2.5 py-0.5 text-xs font-medium"
                      style={{ borderColor: eq.estado.color, color: eq.estado.color }}
                    >
                      {eq.estado.nombre}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(eq)}
                      className="text-neutral-400 transition-colors hover:text-blue-500"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteEquipo(eq.id)}
                      className="text-neutral-400 transition-colors hover:text-red-500"
                      title="Eliminar"
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
    </div>
  )
}