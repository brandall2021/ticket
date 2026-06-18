"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Paperclip, X, Upload } from "lucide-react"
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

interface ArchivoSubido {
  nombre: string
  url: string
}

export default function NuevoTicketPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [prioridad, setPrioridad] = useState("MEDIA")
  const [categoriaId, setCategoriaId] = useState("")
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [archivos, setArchivos] = useState<File[]>([])
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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    setArchivos((prev) => [...prev, ...files])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function removeFile(index: number) {
    setArchivos((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    let archivosSubidos: ArchivoSubido[] = []

    if (archivos.length > 0) {
      const formData = new FormData()
      archivos.forEach((f) => formData.append("archivos", f))

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadRes.ok) {
        setError("Error al subir archivos")
        setSubmitting(false)
        return
      }

      const uploadData = await uploadRes.json()
      archivosSubidos = uploadData.archivos
    }

    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo,
        descripcion,
        prioridad,
        categoriaId: categoriaId || null,
        archivos: archivosSubidos,
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

            <div className="space-y-2">
              <Label>Archivos adjuntos</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Seleccionar archivos
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              {archivos.length > 0 && (
                <div className="mt-2 space-y-1">
                  {archivos.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip className="h-4 w-4 shrink-0 text-neutral-400" />
                        <span className="truncate">{file.name}</span>
                        <span className="shrink-0 text-neutral-400">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="ml-2 shrink-0 text-neutral-400 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
