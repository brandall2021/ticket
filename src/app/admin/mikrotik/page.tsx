"use client"

import Link from "next/link"
import { useState, useEffect, useCallback } from "react"
import { Router, Plus, Trash2, RefreshCw, Wifi, WifiOff, AlertTriangle, ArrowRight, Loader2, CheckCircle2, XCircle } from "lucide-react"

interface Router {
  id: string
  nombre: string
  host: string
  apiPort: number
  useTls: boolean
  user: string
  activo: boolean
  identidad: string | null
  version: string | null
  boardName: string | null
  ultimoEstado: string | null
  ultimoError: string | null
  ultimaConexion: string | null
  cpuLoad: number | null
}

export default function MikrotikListPage() {
  const [routers, setRouters] = useState<Router[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string; info?: { identidad: string | null; version: string | null; boardName: string | null } } | null>(null)
  const [form, setForm] = useState({
    nombre: "",
    host: "",
    apiPort: 8728,
    useTls: false,
    user: "admin",
    password: "",
    notificarAdmin: true,
  })

  const fetchRouters = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/mikrotik")
      if (res.ok) setRouters(await res.json())
    } catch { /* empty */ }
    setLoading(false)
  }, [])

  useEffect(() => { const t = setTimeout(fetchRouters, 0); return () => clearTimeout(t) }, [fetchRouters])

  async function testConnection() {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch("/api/admin/mikrotik/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: form.host,
          apiPort: form.apiPort,
          useTls: form.useTls,
          user: form.user,
          password: form.password,
        }),
      })
      setTestResult(await res.json())
    } catch (err) {
      setTestResult({ ok: false, error: String(err) })
    }
    setTesting(false)
  }

  async function createRouter() {
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/admin/mikrotik", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || "Error al crear el router")
      } else {
        setShowForm(false)
        setForm({ nombre: "", host: "", apiPort: 8728, useTls: false, user: "admin", password: "", notificarAdmin: true })
        setTestResult(null)
        await fetchRouters()
      }
    } catch (err) {
      setError(String(err))
    }
    setSaving(false)
  }

  async function deleteRouter(id: string, nombre: string) {
    if (!confirm(`¿Eliminar el router "${nombre}"? Se borrarán sus snapshots, tráfico y alertas.`)) return
    const res = await fetch(`/api/admin/mikrotik?id=${id}`, { method: "DELETE" })
    if (res.ok) await fetchRouters()
  }

  async function refreshRouter(id: string) {
    await fetch(`/api/admin/mikrotik/${id}`, { method: "POST" })
    await fetchRouters()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Routers MikroTik</h2>
          <p className="text-sm text-neutral-500">Administración y monitoreo vía API RouterOS (puerto 8728/8729)</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Agregar router
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700/50 dark:bg-neutral-800/50">
          <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Nuevo router</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input label="Nombre" value={form.nombre} onChange={v => setForm({ ...form, nombre: v })} placeholder="Oficina central" />
            <Input label="Host / IP" value={form.host} onChange={v => setForm({ ...form, host: v })} placeholder="192.168.10.1" />
            <Input label="Puerto API" value={form.apiPort} onChange={v => setForm({ ...form, apiPort: parseInt(v) || 8728 })} type="number" />
            <Input label="Usuario" value={form.user} onChange={v => setForm({ ...form, user: v })} />
            <Input label="Contraseña" value={form.password} onChange={v => setForm({ ...form, password: v })} type="password" />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
              <input type="checkbox" checked={form.useTls} onChange={e => setForm({ ...form, useTls: e.target.checked })} className="h-4 w-4 rounded" />
              TLS (API-SSL, puerto 8729)
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
              <input type="checkbox" checked={form.notificarAdmin} onChange={e => setForm({ ...form, notificarAdmin: e.target.checked })} className="h-4 w-4 rounded" />
              Notificar admin por email/notificación
            </label>
          </div>

          {testResult && (
            <div className={`mt-3 flex items-start gap-2 rounded-lg border p-3 text-sm ${
              testResult.ok
                ? "border-green-500/30 bg-green-500/10 text-green-600"
                : "border-red-500/30 bg-red-500/10 text-red-600"
            }`}>
              {testResult.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
              <div>
                {testResult.ok ? (
                  <>
                    <p className="font-medium">Conexión exitosa</p>
                    <p className="text-xs">
                      {testResult.info?.identidad} — RouterOS {testResult.info?.version} ({testResult.info?.boardName})
                    </p>
                  </>
                ) : (
                  <p>{testResult.error}</p>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={testConnection}
              disabled={testing || !form.host}
              className="flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-700"
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Probar conexión
            </button>
            <button
              onClick={createRouter}
              disabled={saving || !form.nombre || !form.host}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Guardar
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
              Cancelar
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="h-36 animate-pulse rounded-xl border border-neutral-200 bg-white dark:border-neutral-700/50 dark:bg-neutral-800/50" />)}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {routers.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-neutral-300 p-10 text-center text-neutral-500 dark:border-neutral-700">
              <Router className="mx-auto mb-2 h-8 w-8" />
              No hay routers configurados. Agregá el primero con el botón superior.
            </div>
          ) : (
            routers.map(r => (
              <div key={r.id} className="rounded-xl border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-neutral-700/50 dark:bg-neutral-800/50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 ${
                      r.ultimoEstado === "OK" || r.ultimoEstado === "RECUPERADO"
                        ? "bg-green-500/10 text-green-500"
                        : r.ultimoEstado === "ERROR"
                        ? "bg-red-500/10 text-red-500"
                        : "bg-neutral-500/10 text-neutral-500"
                    }`}>
                      <Router className="h-5 w-5" />
                    </div>
                    <div>
                      <Link href={`/admin/mikrotik/${r.id}`} className="font-semibold text-neutral-900 hover:text-blue-600 dark:text-neutral-100">
                        {r.nombre}
                      </Link>
                      <p className="font-mono text-xs text-neutral-500">{r.host}:{r.apiPort}{r.useTls ? " (TLS)" : ""}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    r.ultimoEstado === "OK" || r.ultimoEstado === "RECUPERADO"
                      ? "bg-green-500/10 text-green-500"
                      : r.ultimoEstado === "ERROR"
                      ? "bg-red-500/10 text-red-500"
                      : "bg-neutral-500/10 text-neutral-500"
                  }`}>
                    {r.ultimoEstado || "Sin probar"}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-neutral-100 p-2 dark:bg-neutral-700/40">
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {r.identidad || "—"}
                    </p>
                    <p className="text-[10px] text-neutral-500">Identity</p>
                  </div>
                  <div className="rounded-lg bg-neutral-100 p-2 dark:bg-neutral-700/40">
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {r.cpuLoad !== null ? `${r.cpuLoad}%` : "—"}
                    </p>
                    <p className="text-[10px] text-neutral-500">CPU</p>
                  </div>
                  <div className="rounded-lg bg-neutral-100 p-2 dark:bg-neutral-700/40">
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {r.version || "—"}
                    </p>
                    <p className="text-[10px] text-neutral-500">RouterOS</p>
                  </div>
                </div>

                {r.ultimoError && (
                  <p className="mt-2 flex items-start gap-1 truncate rounded-lg bg-red-500/10 px-2 py-1 text-xs text-red-500" title={r.ultimoError}>
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                    {r.ultimoError}
                  </p>
                )}
                {r.ultimaConexion && !r.ultimoError && (
                  <p className="mt-2 flex items-center gap-1 text-[10px] text-neutral-400">
                    <WifiIcon estado={r.ultimoEstado} />
                    Última conexión: {new Date(r.ultimaConexion).toLocaleString("es-AR")}
                  </p>
                )}

                <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-700/30">
                  <div className="flex gap-1">
                    <button onClick={() => refreshRouter(r.id)} title="Probar conexión" className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-700">
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button onClick={() => deleteRouter(r.id, r.nombre)} title="Eliminar router" className="rounded-lg p-2 text-red-500 hover:bg-red-500/10">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <Link href={`/admin/mikrotik/${r.id}`} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
                    Abrir panel <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function WifiIcon({ estado }: { estado: string | null }) {
  if (estado === "OK" || estado === "RECUPERADO") return <Wifi className="h-3 w-3 text-green-500" />
  if (estado === "ERROR") return <WifiOff className="h-3 w-3 text-red-500" />
  return <Wifi className="h-3 w-3 text-neutral-400" />
}

function Input({ label, value, onChange, placeholder, type = "text" }: {
  label: string
  value: string | number
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 dark:placeholder-neutral-500"
      />
    </label>
  )
}