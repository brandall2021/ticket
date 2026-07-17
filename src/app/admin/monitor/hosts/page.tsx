"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Trash2, Edit, Wifi, WifiOff, Radio, Server, Search, Filter, X } from "lucide-react"
import { useRouter } from "next/navigation"

interface MonitorGroup {
  id: string
  nombre: string
  color: string
}

interface MonitorHost {
  id: string
  nombre: string
  ip: string
  detalle: string | null
  activo: boolean
  lastStatus: string | null
  lastPingAt: string | null
  grupoId: string | null
  grupo: MonitorGroup | null
  pings: { exitoso: boolean; latencia: number | null }[]
}

export default function MonitorHostsPage() {
  const router = useRouter()
  const [hosts, setHosts] = useState<MonitorHost[]>([])
  const [grupos, setGrupos] = useState<MonitorGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterGrupo, setFilterGrupo] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [pingingId, setPingingId] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<MonitorHost | null>(null)
  const [nombre, setNombre] = useState("")
  const [ip, setIp] = useState("")
  const [detalle, setDetalle] = useState("")
  const [grupoId, setGrupoId] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [showGroupForm, setShowGroupForm] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [groupColor, setGroupColor] = useState("#3b82f6")
  const [savingGroup, setSavingGroup] = useState(false)

  const fetchAll = useCallback(async () => {
    const [hRes, gRes] = await Promise.all([
      fetch("/api/admin/monitor/hosts"),
      fetch("/api/admin/monitor"),
    ])
    if (hRes.ok) setHosts(await hRes.json())
    if (gRes.ok) setGrupos(await gRes.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    const url = editando ? `/api/admin/monitor/hosts/${editando.id}` : "/api/admin/monitor/hosts"
    const method = editando ? "PATCH" : "POST"
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, ip, detalle: detalle || null, grupoId: grupoId || null }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Error al guardar")
      setSaving(false)
      return
    }
    resetForm()
    fetchAll()
  }

  function resetForm() {
    setNombre(""); setIp(""); setDetalle(""); setGrupoId("")
    setEditando(null); setShowForm(false); setSaving(false); setError("")
  }

  function startEdit(host: MonitorHost) {
    setEditando(host); setNombre(host.nombre); setIp(host.ip)
    setDetalle(host.detalle || ""); setGrupoId(host.grupoId || ""); setShowForm(true)
  }

  async function deleteHost(id: string) {
    if (!confirm("¿Eliminar este host y su historial?")) return
    await fetch(`/api/admin/monitor/hosts/${id}`, { method: "DELETE" })
    fetchAll()
  }

  async function pingHost(hostId: string, ip: string) {
    setPingingId(hostId)
    await fetch("/api/admin/monitor/ping", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hostId, ip }),
    })
    fetchAll()
    setPingingId(null)
  }

  async function handleGroupSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSavingGroup(true)
    const res = await fetch("/api/admin/monitor", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: groupName, color: groupColor }),
    })
    if (res.ok) { setGroupName(""); setGroupColor("#3b82f6"); setShowGroupForm(false); fetchAll() }
    setSavingGroup(false)
  }

  async function deleteGroup(id: string) {
    if (!confirm("¿Eliminar este grupo?")) return
    await fetch(`/api/admin/monitor/${id}`, { method: "DELETE" })
    fetchAll()
  }

  const filtered = hosts.filter(h => {
    const matchSearch = !search ||
      h.nombre.toLowerCase().includes(search.toLowerCase()) ||
      h.ip.includes(search) ||
      h.detalle?.toLowerCase().includes(search.toLowerCase()) ||
      h.grupo?.nombre.toLowerCase().includes(search.toLowerCase())
    const matchGrupo = !filterGrupo || h.grupoId === filterGrupo
    const matchStatus = filterStatus === "all" ||
      (filterStatus === "up" && h.lastStatus === "UP") ||
      (filterStatus === "down" && h.lastStatus === "DOWN") ||
      (filterStatus === "unknown" && !h.lastStatus)
    return matchSearch && matchGrupo && matchStatus
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Gestión de Hosts</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowGroupForm(!showGroupForm)} className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700">
            <Filter className="h-4 w-4" /> Grupos
          </button>
          <button onClick={() => { resetForm(); setShowForm(true) }} className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 active:scale-[0.98]">
            <Plus className="h-4 w-4" /> Nuevo Host
          </button>
        </div>
      </div>

      {showGroupForm && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700/50 dark:bg-neutral-800/50">
          <h4 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Gestionar Grupos</h4>
          <form onSubmit={handleGroupSubmit} className="flex flex-wrap items-end gap-3">
            <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Nombre del grupo" className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100" required />
            <input type="color" value={groupColor} onChange={e => setGroupColor(e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border border-neutral-300 bg-white p-0.5 dark:border-neutral-600 dark:bg-neutral-700" />
            <button type="submit" disabled={savingGroup} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50">{savingGroup ? "..." : "Crear"}</button>
          </form>
          {grupos.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-700/50">
              {grupos.map(g => (
                <div key={g.id} className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs" style={{ borderColor: g.color, color: g.color }}>
                  {g.nombre}
                  <button onClick={() => deleteGroup(g.id)} className="ml-1 hover:text-red-500"><X className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700/50 dark:bg-neutral-800/50">
          <h4 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{editando ? "Editar Host" : "Nuevo Host"}</h4>
          {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre (PC-SERVER-01)" className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100" required />
            <input value={ip} onChange={e => setIp(e.target.value)} placeholder="IP (192.168.1.100)" className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100" required />
            <input value={detalle} onChange={e => setDetalle(e.target.value)} placeholder="Detalle (opcional)" className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100" />
            <select value={grupoId} onChange={e => setGrupoId(e.target.value)} className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100">
              <option value="">Sin grupo</option>
              {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>
            <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
              <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50">{saving ? "Guardando..." : "Guardar"}</button>
              <button type="button" onClick={resetForm} className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-700/50 dark:bg-neutral-800/50">
        <div className="flex flex-wrap items-center gap-3 border-b border-neutral-200 p-4 dark:border-neutral-700/50">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text" placeholder="Buscar por nombre, IP o grupo..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
            />
          </div>
          <select value={filterGrupo} onChange={e => setFilterGrupo(e.target.value)} className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100">
            <option value="">Todos los grupos</option>
            {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100">
            <option value="all">Todos los estados</option>
            <option value="up">Online</option>
            <option value="down">Offline</option>
            <option value="unknown">Sin ping</option>
          </select>
          <span className="text-xs text-neutral-500">{filtered.length} hosts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700/50">
                <th className="px-4 py-3 text-xs font-medium text-neutral-500">Estado</th>
                <th className="px-4 py-3 text-xs font-medium text-neutral-500">Nombre</th>
                <th className="px-4 py-3 text-xs font-medium text-neutral-500">IP</th>
                <th className="px-4 py-3 text-xs font-medium text-neutral-500">Grupo</th>
                <th className="px-4 py-3 text-xs font-medium text-neutral-500">Latencia</th>
                <th className="px-4 py-3 text-xs font-medium text-neutral-500">Último Ping</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3].map(i => (
                  <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-10 animate-pulse rounded bg-neutral-100 dark:bg-neutral-700/50" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-16 text-center text-neutral-500">No hay hosts configurados</td></tr>
              ) : (
                filtered.map(host => {
                  const lastPing = host.pings[0]
                  const status = host.lastStatus
                  const isPinging = pingingId === host.id
                  return (
                    <tr key={host.id} className="border-b border-neutral-100 transition-colors hover:bg-neutral-50 dark:border-neutral-700/30 dark:hover:bg-neutral-700/20">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          status === "UP" ? "bg-green-500/10 text-green-500" : status === "DOWN" ? "bg-red-500/10 text-red-500" : "bg-neutral-500/10 text-neutral-500"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status === "UP" ? "bg-green-500" : status === "DOWN" ? "bg-red-500" : "bg-neutral-500"}`} />
                          {status === "UP" ? "Online" : status === "DOWN" ? "Offline" : "Sin ping"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4 text-neutral-400" />
                          {host.nombre}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-neutral-500">{host.ip}</td>
                      <td className="px-4 py-3">
                        {host.grupo ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: `${host.grupo.color}15`, color: host.grupo.color }}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: host.grupo.color }} />
                            {host.grupo.nombre}
                          </span>
                        ) : <span className="text-xs text-neutral-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {lastPing?.latencia !== null && lastPing?.latencia !== undefined ? (
                          <span className={`font-mono text-xs ${lastPing.latencia < 50 ? "text-green-500" : lastPing.latencia < 200 ? "text-amber-500" : "text-red-500"}`}>
                            {lastPing.latencia}ms
                          </span>
                        ) : <span className="text-xs text-neutral-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-500">
                        {host.lastPingAt ? new Date(host.lastPingAt).toLocaleString("es-AR") : "Nunca"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => pingHost(host.id, host.ip)} disabled={isPinging} title="Ping" className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-blue-500 dark:hover:bg-neutral-700">
                            <Radio className={`h-4 w-4 ${isPinging ? "animate-pulse text-blue-500" : ""}`} />
                          </button>
                          <button onClick={() => startEdit(host)} title="Editar" className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-amber-500 dark:hover:bg-neutral-700">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => deleteHost(host.id)} title="Eliminar" className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-red-500 dark:hover:bg-neutral-700">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
