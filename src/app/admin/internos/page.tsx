"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, X, Check, ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"

interface Interno {
  id: string
  asesor: string
  turno: string
  campania: string
  supervision: string
  interno: string
  rol: string
}

export default function AdminInternosPage() {
  const router = useRouter()
  const [items, setItems] = useState<Interno[]>([])
  const [loading, setLoading] = useState(true)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Interno | null>(null)

  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ asesor: "", turno: "Mañana", campania: "", supervision: "", interno: "", rol: "Asesor" })
  const [creating, setCreating] = useState(false)

  useEffect(() => { fetchItems() }, [])

  async function fetchItems() {
    const res = await fetch("/api/admin/internos")
    const data = await res.json()
    setItems(data)
    setLoading(false)
  }

  function startEdit(item: Interno) {
    setEditingId(item.id)
    setEditForm({ ...item })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm(null)
  }

  async function saveEdit() {
    if (!editingId || !editForm) return
    const res = await fetch(`/api/admin/internos/${editingId}`, {
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
    if (!confirm("¿Eliminar este registro?")) return
    const res = await fetch(`/api/admin/internos/${id}`, { method: "DELETE" })
    if (res.ok) fetchItems()
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    await fetch("/api/admin/internos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    })
    setCreating(false)
    setShowCreate(false)
    setCreateForm({ asesor: "", turno: "Mañana", campania: "", supervision: "", interno: "", rol: "Asesor" })
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
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Internos</h1>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="gap-2">
          <Plus className="h-4 w-4" />
          Agregar
        </Button>
      </div>

      {showCreate && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Nuevo registro</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <Label>Asesor</Label>
                <Input value={createForm.asesor} onChange={e => setCreateForm({ ...createForm, asesor: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label>Turno</Label>
                <Select value={createForm.turno} onChange={e => setCreateForm({ ...createForm, turno: e.target.value })}>
                  <option value="Mañana">Mañana</option>
                  <option value="Tarde">Tarde</option>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Campaña</Label>
                <Input value={createForm.campania} onChange={e => setCreateForm({ ...createForm, campania: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label>Supervisión</Label>
                <Input value={createForm.supervision} onChange={e => setCreateForm({ ...createForm, supervision: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Interno</Label>
                <Input value={createForm.interno} onChange={e => setCreateForm({ ...createForm, interno: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label>Rol</Label>
                <Select value={createForm.rol} onChange={e => setCreateForm({ ...createForm, rol: e.target.value })}>
                  <option value="Asesor">Asesor</option>
                  <option value="Team Leader">Team Leader</option>
                </Select>
              </div>
              <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
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
            <p className="p-6 text-center text-sm text-neutral-500">Sin registros</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:border-navy-700">
                    <th className="px-4 py-3">Asesor</th>
                    <th className="px-4 py-3">Turno</th>
                    <th className="px-4 py-3">Campaña</th>
                    <th className="px-4 py-3">Supervisión</th>
                    <th className="px-4 py-3">Int.</th>
                    <th className="px-4 py-3">Rol</th>
                    <th className="px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-navy-700">
                  {items.map(item => (
                    <tr key={item.id} className="bg-white transition-colors hover:bg-neutral-50 dark:bg-navy-800 dark:hover:bg-navy-700/50">
                      {editingId === item.id && editForm ? (
                        <>
                          <td className="px-4 py-2"><Input value={editForm.asesor} onChange={e => setEditForm({ ...editForm, asesor: e.target.value })} className="h-8 text-sm" /></td>
                          <td className="px-4 py-2">
                            <Select value={editForm.turno} onChange={e => setEditForm({ ...editForm, turno: e.target.value })} className="h-8 text-sm">
                              <option value="Mañana">Mañana</option>
                              <option value="Tarde">Tarde</option>
                            </Select>
                          </td>
                          <td className="px-4 py-2"><Input value={editForm.campania} onChange={e => setEditForm({ ...editForm, campania: e.target.value })} className="h-8 text-sm" /></td>
                          <td className="px-4 py-2"><Input value={editForm.supervision} onChange={e => setEditForm({ ...editForm, supervision: e.target.value })} className="h-8 text-sm" /></td>
                          <td className="px-4 py-2"><Input value={editForm.interno} onChange={e => setEditForm({ ...editForm, interno: e.target.value })} className="h-8 text-sm" /></td>
                          <td className="px-4 py-2">
                            <Select value={editForm.rol} onChange={e => setEditForm({ ...editForm, rol: e.target.value })} className="h-8 text-sm">
                              <option value="Asesor">Asesor</option>
                              <option value="Team Leader">Team Leader</option>
                            </Select>
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
                          <td className="px-4 py-3 font-medium">{item.asesor}</td>
                          <td className="px-4 py-3">{item.turno}</td>
                          <td className="max-w-xs truncate px-4 py-3" title={item.campania}>{item.campania}</td>
                          <td className="px-4 py-3">{item.supervision}</td>
                          <td className="px-4 py-3 font-mono">{item.interno}</td>
                          <td className="px-4 py-3">{item.rol}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
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
