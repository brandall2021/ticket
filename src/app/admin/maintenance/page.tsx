"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Calendar, Pencil, Trash2, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import MaintenanceForm, { type MaintenanceData } from "@/components/admin/maintenance-form"

interface Maintenance {
  id: string
  titulo: string
  descripcion: string | null
  scheduledAt: string
  duration: number
  status: string
  hostIds: string
  createdAt: string
  updatedAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function statusBadge(status: string) {
  switch (status) {
    case "PROGRAMADO":
      return <Badge variant="secondary">Programado</Badge>
    case "EN_CURSO":
      return <Badge variant="warning">En curso</Badge>
    case "FINALIZADO":
      return <Badge variant="success">Finalizado</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

export default function AdminMaintenancePage() {
  const router = useRouter()
  const [items, setItems] = useState<Maintenance[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Maintenance | null>(null)
  const [page, setPage] = useState(1)

  const fetchItems = useCallback(async (p: number) => {
    setLoading(true)
    const res = await fetch(`/api/admin/maintenance?page=${p}&limit=15`)
    if (res.ok) {
      const data = await res.json()
      setItems(data.items)
      setPagination(data.pagination)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchItems(page) }, [page, fetchItems])

  function openNew() {
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(item: Maintenance) {
    setEditing(item)
    setShowForm(true)
  }

  async function handleSave(data: MaintenanceData) {
    if (data.id) {
      await fetch(`/api/admin/maintenance/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
    } else {
      await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
    }
    setShowForm(false)
    setEditing(null)
    fetchItems(page)
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este mantenimiento?")) return
    const res = await fetch(`/api/admin/maintenance/${id}`, { method: "DELETE" })
    if (res.ok) {
      fetchItems(page)
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Wrench className="h-6 w-6 text-brand-600" />
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Mantenimiento Programado
          </h1>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo mantenimiento
        </Button>
      </div>

      {showForm && (
        <MaintenanceForm
          initial={editing ? {
            id: editing.id,
            titulo: editing.titulo,
            descripcion: editing.descripcion || "",
            scheduledAt: editing.scheduledAt,
            duration: editing.duration,
            status: editing.status,
            hostIds: editing.hostIds,
          } : undefined}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-neutral-100 dark:bg-navy-700" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 py-16 text-center dark:border-navy-600">
          <Calendar className="mx-auto mb-4 h-12 w-12 text-neutral-300 dark:text-navy-600" />
          <p className="text-neutral-500 dark:text-neutral-400">
            No hay mantenimientos programados
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-navy-700">
                    <th className="px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">Título</th>
                    <th className="px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">Fecha</th>
                    <th className="px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">Duración</th>
                    <th className="px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">Hosts</th>
                    <th className="px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">Estado</th>
                    <th className="px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr
                      key={item.id}
                      className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 dark:border-navy-700/50 dark:hover:bg-navy-700/30"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">{item.titulo}</p>
                        {item.descripcion && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                            {item.descripcion}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                        {formatDate(item.scheduledAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">
                        {item.duration} min
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-neutral-700 dark:text-neutral-300">
                        {item.hostIds}
                      </td>
                      <td className="px-4 py-3">{statusBadge(item.status)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => openEdit(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-500"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            {pagination.total} resultados — Página {pagination.page} de {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
