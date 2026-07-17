"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Bell, BellOff, CheckCheck, Trash2, Ticket, Activity, Info } from "lucide-react"
import Link from "next/link"

interface Notification {
  id: string
  tipo: string
  titulo: string
  mensaje: string
  url: string | null
  leida: boolean
  createdAt: string
}

const iconMap: Record<string, typeof Ticket> = {
  ticket: Ticket,
  monitor: Activity,
  sistema: Info,
}

export default function NotificacionesPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [noLeidas, setNoLeidas] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=50")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setNoLeidas(data.noLeidas)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  async function markAsRead(ids: string[]) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
    setNotifications((prev) =>
      prev.map((n) => (ids.includes(n.id) ? { ...n, leida: true } : n))
    )
    setNoLeidas((prev) => Math.max(0, prev - ids.length))
  }

  async function markAllAsRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marcarTodas: true }),
    })
    setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })))
    setNoLeidas(0)
  }

  async function deleteAll() {
    if (!confirm("¿Eliminar todas las notificaciones?")) return
    await fetch("/api/notifications", { method: "DELETE" })
    setNotifications([])
    setNoLeidas(0)
  }

  function handleClick(n: Notification) {
    if (!n.leida) markAsRead([n.id])
    if (n.url) router.push(n.url)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-[var(--bg-secondary)]" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Notificaciones</h1>
          {noLeidas > 0 && (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
              {noLeidas}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {noLeidas > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--bg-secondary)] px-3 py-2 text-sm font-medium hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <CheckCheck className="h-4 w-4" />
              Marcar todo leído
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={deleteAll}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-color)] py-16">
          <BellOff className="mb-3 h-12 w-12 text-[var(--text-muted)]" />
          <p className="text-[var(--text-muted)]">No hay notificaciones</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = iconMap[n.tipo] || Bell
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full rounded-lg border border-[var(--border-color)] p-4 text-left transition-colors hover:bg-[var(--bg-secondary)] ${
                  !n.leida ? "bg-[var(--bg-tertiary)]" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      n.tipo === "monitor"
                        ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                        : n.tipo === "ticket"
                        ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold ${!n.leida ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
                        {n.titulo}
                      </p>
                      {!n.leida && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-[var(--text-muted)] line-clamp-2">{n.mensaje}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {new Date(n.createdAt).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
