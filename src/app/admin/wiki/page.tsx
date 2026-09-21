"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Plus, Pencil, Trash2, X, Check, ArrowLeft, Save, Eye,
  FolderPlus, ChevronDown, ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { RichTextEditor } from "@/components/rich-text-editor"
import { WikiIcon, WIKI_ICON_NAMES } from "@/lib/wiki-icons"

interface Categoria {
  id: string
  nombre: string
  color: string
  icono: string
  orden: number
  activo: boolean
  _count?: { articulos: number }
}

interface Articulo {
  id: string
  titulo: string
  resumen: string | null
  contenido: string | null
  activo: boolean
  updatedAt: string
  categoriaId: string
  categoria: Categoria
}

export default function AdminWikiPage() {
  const router = useRouter()

  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [articulos, setArticulos] = useState<Articulo[]>([])
  const [loading, setLoading] = useState(true)

  const [showCategorias, setShowCategorias] = useState(true)
  const [catForm, setCatForm] = useState({ nombre: "", color: "#3b82f6", icono: "BookOpen" })
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [editCatForm, setEditCatForm] = useState<Categoria | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Articulo | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ categoriaId: "", titulo: "", resumen: "", contenido: "" })
  const [creating, setCreating] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const [catRes, artRes] = await Promise.all([
      fetch("/api/admin/wiki-categorias"),
      fetch("/api/wiki"),
    ])
    const cats = await catRes.json()
    const arts = await artRes.json()
    setCategorias(cats)
    setArticulos(arts)
    setLoading(false)
  }

  async function handleCreateCategoria(e: React.FormEvent) {
    e.preventDefault()
    await fetch("/api/admin/wiki-categorias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(catForm),
    })
    setCatForm({ nombre: "", color: "#3b82f6", icono: "BookOpen" })
    fetchAll()
  }

  function startEditCat(cat: Categoria) {
    setEditingCatId(cat.id)
    setEditCatForm({ ...cat })
  }

  async function saveEditCat() {
    if (!editingCatId || !editCatForm) return
    const res = await fetch(`/api/admin/wiki-categorias/${editingCatId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: editCatForm.nombre, color: editCatForm.color, icono: editCatForm.icono }),
    })
    if (res.ok) {
      setEditingCatId(null)
      setEditCatForm(null)
      fetchAll()
    }
  }

  async function handleDeleteCat(id: string) {
    if (!confirm("¿Eliminar esta categoría?")) return
    const res = await fetch(`/api/admin/wiki-categorias/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error || "No se pudo eliminar")
      return
    }
    fetchAll()
  }

  function startEdit(item: Articulo) {
    setEditingId(item.id)
    setEditForm({ ...item })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm(null)
  }

  async function saveEdit() {
    if (!editingId || !editForm) return
    const res = await fetch(`/api/wiki/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoriaId: editForm.categoriaId,
        titulo: editForm.titulo,
        resumen: editForm.resumen || null,
        contenido: editForm.contenido || null,
      }),
    })
    if (res.ok) {
      setEditingId(null)
      setEditForm(null)
      fetchAll()
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este artículo?")) return
    const res = await fetch(`/api/wiki/${id}`, { method: "DELETE" })
    if (res.ok) fetchAll()
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    await fetch("/api/wiki", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoriaId: createForm.categoriaId,
        titulo: createForm.titulo,
        resumen: createForm.resumen || null,
        contenido: createForm.contenido || null,
      }),
    })
    setCreating(false)
    setShowCreate(false)
    setCreateForm({ categoriaId: "", titulo: "", resumen: "", contenido: "" })
    fetchAll()
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-6 h-8 w-32 animate-pulse rounded bg-neutral-200 dark:bg-navy-700" />
        <div className="h-96 animate-pulse rounded-lg bg-neutral-200 dark:bg-navy-700" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Wiki</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/wiki")}>
            <Eye className="h-4 w-4" />
            Ver wiki
          </Button>
          <Button onClick={() => setShowCreate(!showCreate)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo artículo
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="cursor-pointer py-3" onClick={() => setShowCategorias(!showCategorias)}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              <span className="inline-flex items-center gap-2">
                <FolderPlus className="h-4 w-4" />
                Categorías
                <span className="text-xs font-normal text-neutral-400">({categorias.length})</span>
              </span>
            </CardTitle>
            {showCategorias ? <ChevronDown className="h-4 w-4 text-neutral-400" /> : <ChevronRight className="h-4 w-4 text-neutral-400" />}
          </div>
        </CardHeader>
        {showCategorias && (
          <CardContent>
            <form onSubmit={handleCreateCategoria} className="mb-4 flex flex-wrap items-end gap-2">
              <div className="space-y-1">
                <Label>Nombre</Label>
                <Input
                  value={catForm.nombre}
                  onChange={e => setCatForm({ ...catForm, nombre: e.target.value })}
                  placeholder="Ej: Hardware"
                  required
                  className="w-48"
                />
              </div>
              <div className="space-y-1">
                <Label>Color</Label>
                <input
                  type="color"
                  value={catForm.color}
                  onChange={e => setCatForm({ ...catForm, color: e.target.value })}
                  className="h-9 w-12 rounded-md border border-neutral-200 bg-white dark:border-navy-700 dark:bg-navy-800"
                />
              </div>
              <div className="space-y-1">
                <Label>Icono</Label>
                <Select value={catForm.icono} onChange={e => setCatForm({ ...catForm, icono: e.target.value })} className="w-36">
                  {WIKI_ICON_NAMES.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </Select>
              </div>
              <Button type="submit" size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Crear
              </Button>
            </form>

            <div className="flex flex-wrap gap-2">
              {categorias.length === 0 && (
                <p className="text-sm text-neutral-400">Sin categorías. Creá la primera arriba.</p>
              )}
              {categorias.map(cat => {
                const count = cat._count?.articulos ?? 0
                if (editingCatId === cat.id && editCatForm) {
                  return (
                    <div key={cat.id} className="flex items-center gap-2 rounded-lg border border-neutral-200 p-2 dark:border-navy-700">
                      <Input value={editCatForm.nombre} onChange={e => setEditCatForm({ ...editCatForm, nombre: e.target.value })} className="h-8 w-36" />
                      <input
                        type="color"
                        value={editCatForm.color}
                        onChange={e => setEditCatForm({ ...editCatForm, color: e.target.value })}
                        className="h-8 w-10 rounded border border-neutral-200 bg-white dark:border-navy-700 dark:bg-navy-800"
                      />
                      <Select value={editCatForm.icono} onChange={e => setEditCatForm({ ...editCatForm, icono: e.target.value })} className="h-8 w-32">
                          {WIKI_ICON_NAMES.map(name => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </Select>
                      <Button size="sm" variant="ghost" onClick={saveEditCat} className="h-8 w-8 p-0 text-green-600"><Check className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditingCatId(null); setEditCatForm(null) }} className="h-8 w-8 p-0"><X className="h-4 w-4" /></Button>
                    </div>
                  )
                }
                return (
                  <div
                    key={cat.id}
                    className="group flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 dark:border-navy-700"
                  >
                    <span
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md"
                      style={{ backgroundColor: `${cat.color}1a`, color: cat.color }}
                    >
                      <WikiIcon name={cat.icono} className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-sm font-medium" style={{ color: cat.color }}>{cat.nombre}</span>
                    <span className="text-xs text-neutral-400">{count}</span>
                    <Button size="sm" variant="ghost" onClick={() => startEditCat(cat)} className="h-7 w-7 p-0 opacity-0 transition-opacity group-hover:opacity-100"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteCat(cat.id)} className="h-7 w-7 p-0 text-red-500 opacity-0 transition-opacity group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        )}
      </Card>

      {showCreate && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Nuevo artículo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Categoría</Label>
                  <Select value={createForm.categoriaId} onChange={e => setCreateForm({ ...createForm, categoriaId: e.target.value })} required>
                    <option value="" disabled>Seleccionar categoría</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Título</Label>
                  <Input value={createForm.titulo} onChange={e => setCreateForm({ ...createForm, titulo: e.target.value })} required placeholder="Título del artículo" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Resumen (opcional)</Label>
                <Input value={createForm.resumen} onChange={e => setCreateForm({ ...createForm, resumen: e.target.value })} placeholder="Breve descripción para el listado" />
              </div>
              <div className="space-y-1">
                <Label>Contenido</Label>
                <RichTextEditor
                  value={createForm.contenido}
                  onChange={html => setCreateForm({ ...createForm, contenido: html })}
                  placeholder="Escribí el contenido del artículo..."
                  minHeight={300}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={creating} className="gap-2">
                  <Save className="h-4 w-4" />
                  {creating ? "Guardando..." : "Guardar"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {articulos.length === 0 ? (
            <p className="p-6 text-center text-sm text-neutral-500">Sin artículos</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:border-navy-700">
                    <th className="px-4 py-3">Título</th>
                    <th className="px-4 py-3">Categoría</th>
                    <th className="px-4 py-3">Contenido</th>
                    <th className="px-4 py-3">Actualizado</th>
                    <th className="px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-navy-700">
                  {articulos.map(item => (
                    <tr key={item.id} className="bg-white transition-colors hover:bg-neutral-50 dark:bg-navy-800 dark:hover:bg-navy-700/50">
                      {editingId === item.id && editForm ? (
                        <>
                          <td className="px-4 py-2 min-w-[220px]">
                            <div className="space-y-2">
                              <Input value={editForm.titulo} onChange={e => setEditForm({ ...editForm, titulo: e.target.value })} className="h-8 text-sm" />
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <Select value={editForm.categoriaId} onChange={e => setEditForm({ ...editForm, categoriaId: e.target.value })} className="h-8 w-40">
                              <option value="" disabled>Seleccionar categoría</option>
                              {categorias.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                              ))}
                            </Select>
                          </td>
                          <td className="px-4 py-2">
                            <div className="space-y-2">
                              <Input value={editForm.resumen || ""} onChange={e => setEditForm({ ...editForm, resumen: e.target.value })} className="h-8 text-sm" placeholder="Resumen" />
                              <RichTextEditor
                                value={editForm.contenido || ""}
                                onChange={html => setEditForm({ ...editForm, contenido: html })}
                                placeholder="Contenido del artículo..."
                                minHeight={180}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2" />
                          <td className="px-4 py-2">
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={saveEdit} className="h-8 w-8 p-0 text-green-600"><Check className="h-4 w-4" /></Button>
                              <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-8 w-8 p-0"><X className="h-4 w-4" /></Button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 font-medium">{item.titulo}</td>
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium"
                              style={{ backgroundColor: `${item.categoria.color}1a`, color: item.categoria.color }}
                            >
                              <WikiIcon name={item.categoria.icono} className="h-3 w-3" style={{ color: item.categoria.color }} />
                              {item.categoria.nombre}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {item.contenido ? (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                <span className="h-2 w-2 rounded-full bg-green-500" />
                                Con contenido
                              </span>
                            ) : (
                              <span className="text-xs text-neutral-400">Sin contenido</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-neutral-500">{new Date(item.updatedAt).toLocaleDateString("es-AR")}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <a href={`/wiki/${item.id}`} target="_blank" rel="noreferrer">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><Eye className="h-4 w-4" /></Button>
                              </a>
                              <Button size="sm" variant="ghost" onClick={() => startEdit(item)} className="h-8 w-8 p-0"><Pencil className="h-4 w-4" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)} className="h-8 w-8 p-0 text-red-500"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </td>
                        </>
                      )}
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