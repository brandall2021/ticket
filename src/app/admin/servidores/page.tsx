"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  ArrowRight,
  Loader2,
  Monitor,
  Pencil,
  PlugZap,
  Plus,
  Server,
  Terminal,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { EMPTY_SERVER_FORM, ServerForm, type ServerFormValues } from "@/components/servers/server-form"

interface ServerItem {
  id: string
  nombre: string
  host: string
  protocolo: "SSH" | "RDP"
  puerto: number
  usuario: string
  dominio: string | null
  resolucion: string | null
  seguridad: string | null
  descripcion: string | null
  grupo: string | null
  color: string
  activo: boolean
  fingerprint: string | null
  ultimoEstado: string | null
  ultimoError: string | null
  ultimaConexion: string | null
  tienePassword: boolean
  tieneClavePrivada: boolean
  sesionesActivas: number
}

function toForm(item: ServerItem): ServerFormValues {
  return {
    nombre: item.nombre,
    host: item.host,
    protocolo: item.protocolo,
    puerto: item.puerto,
    usuario: item.usuario,
    password: "",
    privateKey: "",
    passphrase: "",
    dominio: item.dominio ?? "",
    resolucion: item.resolucion ?? "1280x800",
    seguridad: item.seguridad ?? "any",
    descripcion: item.descripcion ?? "",
    grupo: item.grupo ?? "",
    activo: item.activo,
  }
}

function toPayload(values: ServerFormValues): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    nombre: values.nombre,
    host: values.host,
    protocolo: values.protocolo,
    puerto: values.puerto,
    usuario: values.usuario,
    dominio: values.dominio || null,
    resolucion: values.resolucion || null,
    seguridad: values.seguridad,
    descripcion: values.descripcion || null,
    grupo: values.grupo || null,
    activo: values.activo,
  }
  if (values.password) payload.password = values.password
  if (values.privateKey) payload.privateKey = values.privateKey
  if (values.passphrase) payload.passphrase = values.passphrase
  return payload
}

export default function ServidoresPage() {
  const [items, setItems] = useState<ServerItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ServerItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [probando, setProbando] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/servers", { cache: "no-store" })
      if (response.ok) setItems(await response.json())
    } catch {
      setError("No se pudo cargar la lista de servidores")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchItems()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchItems])

  const grupos = useMemo(() => {
    const map = new Map<string, ServerItem[]>()
    for (const item of items) {
      const key = item.grupo?.trim() || "Sin grupo"
      const list = map.get(key) ?? []
      list.push(item)
      map.set(key, list)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b, "es"))
  }, [items])

  async function guardar(values: ServerFormValues) {
    setSaving(true)
    setError(null)
    try {
      const response = await fetch(
        editing ? `/api/admin/servers/${editing.id}` : "/api/admin/servers",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toPayload(values)),
        }
      )
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(data.error || "No se pudo guardar el servidor")
        return
      }
      setShowForm(false)
      setEditing(null)
      await fetchItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado")
    } finally {
      setSaving(false)
    }
  }

  async function eliminar(item: ServerItem) {
    if (!confirm(`¿Eliminar el servidor "${item.nombre}"? Se borrará también su historial de accesos.`)) return
    const response = await fetch(`/api/admin/servers/${item.id}`, { method: "DELETE" })
    if (response.ok) await fetchItems()
  }

  async function probar(item: ServerItem) {
    setProbando(item.id)
    try {
      const response = await fetch("/api/admin/servers/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      })
      const data = await response.json()
      if (!data.ok) toast.error(data.error || "No se pudo conectar")
      else toast.success(data.detalle || "Conexión correcta")
      await fetchItems()
    } finally {
      setProbando(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--text-primary)]">
            <Server className="h-6 w-6" />
            Servidores
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Acceso SSH y RDP a los servidores, con credenciales cifradas y registro de sesiones.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setShowForm(true)
            setError(null)
          }}
        >
          <Plus className="h-4 w-4" />
          Agregar servidor
        </Button>
      </div>

      {showForm && (
        <ServerForm
          key={editing?.id ?? "nuevo"}
          initial={editing ? toForm(editing) : EMPTY_SERVER_FORM}
          mode={editing ? "edit" : "create"}
          serverId={editing?.id}
          tienePassword={editing?.tienePassword}
          tieneClavePrivada={editing?.tieneClavePrivada}
          saving={saving}
          error={error}
          onSubmit={guardar}
          onCancel={() => {
            setShowForm(false)
            setEditing(null)
            setError(null)
          }}
        />
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border-color)] p-12 text-center">
          <Server className="mx-auto mb-3 h-9 w-9 text-[var(--text-muted)]" />
          <p className="font-medium text-[var(--text-primary)]">Todavía no hay servidores cargados</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Agregá el primero con el botón de arriba para acceder por SSH o RDP.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grupos.map(([grupo, servidores]) => (
            <section key={grupo} className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{grupo}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {servidores.map(item => (
                  <article
                    key={item.id}
                    className="flex flex-col rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                            item.protocolo === "SSH"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-brand-500/10 text-brand-600 dark:text-brand-400"
                          }`}
                        >
                          {item.protocolo === "SSH" ? <Terminal className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                        </span>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/servidores/${item.id}`}
                            className="block truncate font-semibold text-[var(--text-primary)] hover:text-brand-600"
                          >
                            {item.nombre}
                          </Link>
                          <p className="truncate font-mono text-xs text-[var(--text-muted)]">
                            {item.host}:{item.puerto}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          item.protocolo === "SSH"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-brand-500/10 text-brand-600 dark:text-brand-400"
                        }`}
                      >
                        {item.protocolo}
                      </span>
                    </div>

                    <dl className="mt-3 space-y-1 text-xs text-[var(--text-secondary)]">
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-[var(--text-muted)]">Usuario</dt>
                        <dd className="truncate font-mono">{item.usuario}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-[var(--text-muted)]">Credencial</dt>
                        <dd>
                          {item.tienePassword || item.tieneClavePrivada
                            ? item.tieneClavePrivada
                              ? "Clave SSH"
                              : "Contraseña"
                            : "Sin guardar"}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-[var(--text-muted)]">Último acceso</dt>
                        <dd>
                          {item.ultimaConexion
                            ? new Date(item.ultimaConexion).toLocaleString("es-AR", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })
                            : "Nunca"}
                        </dd>
                      </div>
                    </dl>

                    {item.ultimoError && (
                      <p className="mt-2 truncate rounded-lg bg-red-500/10 px-2 py-1 text-[11px] text-red-500" title={item.ultimoError}>
                        {item.ultimoError}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between border-t border-[var(--border-color)] pt-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => probar(item)}
                          disabled={probando === item.id}
                          title="Probar conexión"
                          className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-50"
                        >
                          {probando === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => {
                            setEditing(item)
                            setShowForm(true)
                            setError(null)
                          }}
                          title="Editar"
                          className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => eliminar(item)}
                          title="Eliminar"
                          className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        {item.sesionesActivas > 0 && (
                          <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                            <Wifi className="h-3 w-3" />
                            {item.sesionesActivas} activa{item.sesionesActivas === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/admin/servidores/${item.id}`}
                        className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                      >
                        Conectar <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>

                    {!item.activo && (
                      <p className="mt-2 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                        <WifiOff className="h-3 w-3" />
                        Deshabilitado
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
