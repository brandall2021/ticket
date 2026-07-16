"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, X, Check, ArrowLeft, Save, ExternalLink, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RichTextEditor } from "@/components/rich-text-editor"

interface Instructivo {
  id: string
  title: string
  description: string
  url: string
  imageUrl: string
  contenido: string | null
  activo: boolean
}

export default function AdminInstructivosPage() {
  const router = useRouter()
  const [items, setItems] = useState<Instructivo[]>([])
  const [loading, setLoading] = useState(true)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Instructivo | null>(null)

  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ title: "", description: "Instructivo de Gestión", url: "", imageUrl: "", contenido: "" })
  const [creating, setCreating] = useState(false)

  useEffect(() => { fetchItems() }, [])

  async function fetchItems() {
    const res = await fetch("/api/admin/instructivos")
    const data = await res.json()
    setItems(data)
    setLoading(false)
  }

  function startEdit(item: Instructivo) {
    setEditingId(item.id)
    setEditForm({ ...item })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm(null)
  }

  async function saveEdit() {
    if (!editingId || !editForm) return
    const res = await fetch(`/api/admin/instructivos/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    })
    if (res.ok) {
      setEditingId(null)
      setEditForm(null)
      fetchItems()
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este instructivo?")) return
    const res = await fetch(`/api/admin/instructivos/${id}`, { method: "DELETE" })
    if (res.ok) fetchItems()
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    await fetch("/api/admin/instructivos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    })
    setCreating(false)
    setShowCreate(false)
    setCreateForm({ title: "", description: "Instructivo de Gestión", url: "", imageUrl: "", contenido: "" })
    fetchItems()
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
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Instructivos</h1>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="gap-2">
          <Plus className="h-4 w-4" />
          Agregar
        </Button>
      </div>

      {showCreate && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Nuevo instructivo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Título</Label>
                  <Input value={createForm.title} onChange={e => setCreateForm({ ...createForm, title: e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <Label>URL del instructivo</Label>
                  <Input value={createForm.url} onChange={e => setCreateForm({ ...createForm, url: e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <Label>Descripción</Label>
                  <Input value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>URL de imagen</Label>
                  <Input value={createForm.imageUrl} onChange={e => setCreateForm({ ...createForm, imageUrl: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Contenido del instructivo</Label>
                <RichTextEditor
                  value={createForm.contenido}
                  onChange={html => setCreateForm({ ...createForm, contenido: html })}
                  placeholder="Escribe el instructivo aquí..."
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
          {items.length === 0 ? (
            <p className="p-6 text-center text-sm text-neutral-500">Sin instructivos</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:border-navy-700">
                    <th className="px-4 py-3">Título</th>
                    <th className="px-4 py-3">Descripción</th>
                    <th className="px-4 py-3">Contenido</th>
                    <th className="px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-navy-700">
                  {items.map(item => (
                    <tr key={item.id} className="bg-white transition-colors hover:bg-neutral-50 dark:bg-navy-800 dark:hover:bg-navy-700/50">
                      {editingId === item.id && editForm ? (
                        <>
                          <td className="px-4 py-2"><Input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} className="h-8 text-sm" /></td>
                          <td className="px-4 py-2"><Input value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="h-8 text-sm" /></td>
                          <td className="px-4 py-2 min-w-[300px]">
                            <RichTextEditor
                              value={editForm.contenido || ""}
                              onChange={html => setEditForm({ ...editForm, contenido: html })}
                              placeholder="Contenido del instructivo..."
                              minHeight={200}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={saveEdit} className="h-8 w-8 p-0 text-green-600"><Check className="h-4 w-4" /></Button>
                              <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-8 w-8 p-0"><X className="h-4 w-4" /></Button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 font-medium">{item.title}</td>
                          <td className="max-w-xs truncate px-4 py-3 text-neutral-500" title={item.description}>{item.description}</td>
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
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <a href={`/instructivos/${item.id}`} target="_blank" rel="noreferrer">
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