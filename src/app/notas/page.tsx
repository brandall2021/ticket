"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Search, Pin, PinOff, Trash2, X, Check, Save, StickyNote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Note {
  id: string
  titulo: string
  contenido: string
  pinned: boolean
  createdAt: string
  updatedAt: string
}

export default function NotasPage() {
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [searching, setSearching] = useState(false)

  const [showEditor, setShowEditor] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [titulo, setTitulo] = useState("")
  const [contenido, setContenido] = useState("")
  const [saving, setSaving] = useState(false)

  const fetchNotes = useCallback(async (q?: string) => {
    setSearching(true)
    const url = q ? `/api/notas?q=${encodeURIComponent(q)}` : "/api/notas"
    const res = await fetch(url)
    const data = await res.json()
    setNotes(data)
    setLoading(false)
    setSearching(false)
  }, [])

  useEffect(() => { fetchNotes() }, [fetchNotes])

  useEffect(() => {
    const t = setTimeout(() => {
      fetchNotes(search || undefined)
    }, 300)
    return () => clearTimeout(t)
  }, [search, fetchNotes])

  function openNew() {
    setEditingNote(null)
    setTitulo("")
    setContenido("")
    setShowEditor(true)
  }

  function openEdit(note: Note) {
    setEditingNote(note)
    setTitulo(note.titulo)
    setContenido(note.contenido)
    setShowEditor(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim() || !contenido.trim()) return
    setSaving(true)

    if (editingNote) {
      await fetch(`/api/notas/${editingNote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, contenido }),
      })
    } else {
      await fetch("/api/notas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, contenido }),
      })
    }

    setSaving(false)
    setShowEditor(false)
    fetchNotes(search || undefined)
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta nota?")) return
    await fetch(`/api/notas/${id}`, { method: "DELETE" })
    fetchNotes(search || undefined)
  }

  async function handleTogglePin(note: Note) {
    await fetch(`/api/notas/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !note.pinned }),
    })
    fetchNotes(search || undefined)
  }

  function highlightText(text: string, query: string): string {
    if (!query.trim()) return text
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">$1</mark>')
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Mis Notas</h1>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva nota
        </Button>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <Input
          placeholder="Buscar en notas..."
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
              <div className="space-y-1">
                <Label>Título</Label>
                <Input
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  placeholder="Nombre de la nota..."
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Contenido</Label>
                <textarea
                  value={contenido}
                  onChange={e => setContenido(e.target.value)}
                  placeholder="Escribe o pega tu nota aquí..."
                  className="w-full min-h-[300px] rounded-lg border border-neutral-200 bg-white p-4 text-sm leading-relaxed focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-navy-600 dark:bg-navy-800 dark:text-neutral-100 dark:focus:border-brand-400 font-mono"
                  required
                />
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
            <div key={i} className="h-24 animate-pulse rounded-lg bg-neutral-100 dark:bg-navy-700" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 py-16 text-center dark:border-navy-600">
          <StickyNote className="mx-auto mb-4 h-12 w-12 text-neutral-300 dark:text-navy-600" />
          <p className="text-neutral-500 dark:text-neutral-400">
            {search ? "No se encontraron notas con esa búsqueda" : "No tenés notas todavía"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <Card key={note.id} className="group transition-all hover:shadow-md dark:hover:shadow-navy-700/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 cursor-pointer" onClick={() => openEdit(note)}>
                    <div className="flex items-center gap-2">
                      {note.pinned && (
                        <Pin className="h-3.5 w-3.5 shrink-0 text-brand-500" />
                      )}
                      <h3
                        className="font-semibold text-neutral-900 dark:text-neutral-100 truncate"
                        dangerouslySetInnerHTML={{ __html: highlightText(note.titulo, search) }}
                      />
                    </div>
                    <p
                      className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: highlightText(note.contenido.substring(0, 200), search) }}
                    />
                    <p className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
                      {new Date(note.updatedAt).toLocaleString("es-AR")}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handleTogglePin(note)}
                    >
                      {note.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-500"
                      onClick={() => handleDelete(note.id)}
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
