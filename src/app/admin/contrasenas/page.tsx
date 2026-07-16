"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowLeft, Plus, Search, Pencil, Trash2, X, Save, Shield, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

interface PasswordEntry {
  id: string
  ip: string
  contrasena: string
  funcion: string
  descripcion: string
  activo: boolean
  createdAt: string
  autor: { name: string; email: string }
}

export default function ContrasenasPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<PasswordEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showEditor, setShowEditor] = useState(false)
  const [editingEntry, setEditingEntry] = useState<PasswordEntry | null>(null)
  const [ip, setIp] = useState("")
  const [contrasena, setContrasena] = useState("")
  const [funcion, setFuncion] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [saving, setSaving] = useState(false)
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set())

  const fetchEntries = useCallback(async (q?: string) => {
    const url = q ? `/api/admin/contrasenas?q=${encodeURIComponent(q)}` : "/api/admin/contrasenas"
    const res = await fetch(url)
    const data = await res.json()
    setEntries(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  useEffect(() => {
    const t = setTimeout(() => {
      fetchEntries(search || undefined)
    }, 300)
    return () => clearTimeout(t)
  }, [search, fetchEntries])

  function openNew() {
    setEditingEntry(null)
    setIp("")
    setContrasena("")
    setFuncion("")
    setDescripcion("")
    setShowEditor(true)
  }

  function openEdit(entry: PasswordEntry) {
    setEditingEntry(entry)
    setIp(entry.ip)
    setContrasena(entry.contrasena)
    setFuncion(entry.funcion)
    setDescripcion(entry.descripcion)
    setShowEditor(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!ip.trim() || !contrasena.trim() || !funcion.trim() || !descripcion.trim()) return
    setSaving(true)

    if (editingEntry) {
      await fetch(`/api/admin/contrasenas/${editingEntry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip, contrasena, funcion, descripcion }),
      })
    } else {
      await fetch("/api/admin/contrasenas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip, contrasena, funcion, descripcion }),
      })
    }

    setSaving(false)
    setShowEditor(false)
    fetchEntries(search || undefined)
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta entrada?")) return
    await fetch(`/api/admin/contrasenas/${id}`, { method: "DELETE" })
    fetchEntries(search || undefined)
  }

  function togglePassword(id: string) {
    setVisiblePasswords(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Shield className="h-6 w-6 text-brand-600" />
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Contraseñas</h1>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva entrada
        </Button>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <Input
          placeholder="Buscar por IP, función, descripción..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showEditor && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Dirección IP</Label>
                  <Input
                    value={ip}
                    onChange={e => setIp(e.target.value)}
                    placeholder="192.168.1.1"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Contraseña</Label>
                  <Input
                    type="text"
                    value={contrasena}
                    onChange={e => setContrasena(e.target.value)}
                    placeholder="••••••"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Función</Label>
                  <Input
                    value={funcion}
                    onChange={e => setFuncion(e.target.value)}
                    placeholder="Servidor web, Base de datos, etc."
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Descripción</Label>
                  <Input
                    value={descripcion}
                    onChange={e => setDescripcion(e.target.value)}
                    placeholder="Descripción breve..."
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving} className="gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowEditor(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-neutral-100 dark:bg-navy-700" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 py-16 text-center dark:border-navy-600">
          <Shield className="mx-auto mb-4 h-12 w-12 text-neutral-300 dark:text-navy-600" />
          <p className="text-neutral-500 dark:text-neutral-400">
            {search ? "No se encontraron resultados" : "No hay entradas registradas"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => (
            <Card key={entry.id} className="group transition-all hover:shadow-md dark:hover:shadow-navy-700/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-4">
                    <div>
                      <p className="text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">IP</p>
                      <p className="font-mono text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {entry.ip}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">Contraseña</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm text-neutral-900 dark:text-neutral-100">
                          {visiblePasswords.has(entry.id) ? entry.contrasena : "••••••••"}
                        </p>
                        <button
                          onClick={() => togglePassword(entry.id)}
                          className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                        >
                          {visiblePasswords.has(entry.id) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">Función</p>
                      <p className="text-sm text-neutral-900 dark:text-neutral-100">{entry.funcion}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">Descripción</p>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300">{entry.descripcion}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(entry)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-500"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
