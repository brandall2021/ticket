"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Edit, Wifi, WifiOff, Radio, Server, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

  const [filterGrupo, setFilterGrupo] = useState("")
  const [pingingId, setPingingId] = useState<string | null>(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const [hRes, gRes] = await Promise.all([
      fetch("/api/admin/monitor/hosts"),
      fetch("/api/admin/monitor"),
    ])
    if (hRes.ok) setHosts(await hRes.json())
    if (gRes.ok) setGrupos(await gRes.json())
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")

    const url = editando
      ? `/api/admin/monitor/hosts/${editando.id}`
      : "/api/admin/monitor/hosts"
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
    setNombre("")
    setIp("")
    setDetalle("")
    setGrupoId("")
    setEditando(null)
    setShowForm(false)
    setSaving(false)
    setError("")
  }

  function startEdit(host: MonitorHost) {
    setEditando(host)
    setNombre(host.nombre)
    setIp(host.ip)
    setDetalle(host.detalle || "")
    setGrupoId(host.grupoId || "")
    setShowForm(true)
  }

  async function deleteHost(id: string) {
    if (!confirm("¿Eliminar este host y todo su historial de pings?")) return
    await fetch(`/api/admin/monitor/hosts/${id}`, { method: "DELETE" })
    fetchAll()
  }

  async function pingHost(hostId: string, ip: string) {
    setPingingId(hostId)
    await fetch("/api/admin/monitor/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hostId, ip }),
    })
    fetchAll()
    setPingingId(null)
  }

  async function handleGroupSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSavingGroup(true)
    const res = await fetch("/api/admin/monitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: groupName, color: groupColor }),
    })
    if (res.ok) {
      setGroupName("")
      setGroupColor("#3b82f6")
      setShowGroupForm(false)
      fetchAll()
    }
    setSavingGroup(false)
  }

  async function deleteGroup(id: string) {
    if (!confirm("¿Eliminar este grupo? Los hosts no se eliminan.")) return
    await fetch(`/api/admin/monitor/${id}`, { method: "DELETE" })
    fetchAll()
  }

  const filtered = filterGrupo
    ? hosts.filter(h => h.grupoId === filterGrupo)
    : hosts

  const agrupados = grupos.map(g => ({
    ...g,
    hosts: filtered.filter(h => h.grupoId === g.id),
  }))

  const sinGrupo = filtered.filter(h => !h.grupoId)

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl p-6 space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-neutral-200 dark:bg-navy-700" />
        <div className="h-40 animate-pulse rounded-lg border border-neutral-200 bg-white dark:border-navy-700 dark:bg-navy-800" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/monitor")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            <Server className="mr-2 inline h-6 w-6" />
            Hosts
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowGroupForm(!showGroupForm)}>
            Grupo
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true) }}>
            <Plus className="h-4 w-4" /> Host
          </Button>
        </div>
      </div>

      {showGroupForm && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleGroupSubmit} className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[160px] space-y-1">
                <Label>Nombre del grupo</Label>
                <Input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Ej: Servers, Oficina..." required />
              </div>
              <div className="w-20 space-y-1">
                <Label>Color</Label>
                <input type="color" value={groupColor} onChange={e => setGroupColor(e.target.value)} className="h-9 w-full rounded-md border border-neutral-300 bg-white p-0.5 dark:border-navy-500 dark:bg-navy-800" />
              </div>
              <Button type="submit" size="sm" disabled={savingGroup}>{savingGroup ? "..." : "Crear"}</Button>
            </form>
            {grupos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-neutral-200 pt-3 dark:border-navy-600">
                {grupos.map(g => (
                  <div key={g.id} className="flex items-center gap-1 rounded-full border px-3 py-1 text-xs" style={{ borderColor: g.color, color: g.color }}>
                    {g.nombre}
                    <button onClick={() => deleteGroup(g.id)} className="ml-1 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{editando ? "Editar Host" : "Nuevo Host"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Nombre</Label>
                  <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: PC-SERVER-01" required />
                </div>
                <div className="space-y-1">
                  <Label>IP</Label>
                  <Input value={ip} onChange={e => setIp(e.target.value)} placeholder="192.168.1.100" required />
                </div>
                <div className="space-y-1">
                  <Label>Detalle</Label>
                  <Input value={detalle} onChange={e => setDetalle(e.target.value)} placeholder="Descripción opcional" />
                </div>
                <div className="space-y-1">
                  <Label>Grupo</Label>
                  <select value={grupoId} onChange={e => setGrupoId(e.target.value)} className="flex h-9 w-full rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm dark:border-navy-500 dark:bg-navy-800 dark:text-neutral-100">
                    <option value="">Sin grupo</option>
                    {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-3">
        <Label>Filtrar grupo:</Label>
        <select value={filterGrupo} onChange={e => setFilterGrupo(e.target.value)} className="h-9 rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm dark:border-navy-500 dark:bg-navy-800">
          <option value="">Todos</option>
          {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
        </select>
        <span className="text-xs text-neutral-500">{filtered.length} hosts</span>
      </div>

      {agrupados.map(grupo => (
        <Card key={grupo.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: grupo.color }} />
              {grupo.nombre}
              <span className="text-sm font-normal text-neutral-500">({grupo.hosts.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {grupo.hosts.length === 0 ? (
              <p className="text-sm text-neutral-500">Sin hosts</p>
            ) : (
              <div className="space-y-2">
                {grupo.hosts.map(host => (
                  <HostRow key={host.id} host={host} onPing={pingHost} onEdit={startEdit} onDelete={deleteHost} pingingId={pingingId} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {sinGrupo.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sin grupo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sinGrupo.map(host => (
                <HostRow key={host.id} host={host} onPing={pingHost} onEdit={startEdit} onDelete={deleteHost} pingingId={pingingId} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-neutral-500">
            No hay hosts configurados. Agregá uno con el botón &ldquo;Host&rdquo;.
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function HostRow({
  host,
  onPing,
  onEdit,
  onDelete,
  pingingId,
}: {
  host: MonitorHost
  onPing: (id: string, ip: string) => void
  onEdit: (host: MonitorHost) => void
  onDelete: (id: string) => void
  pingingId: string | null
}) {
  const isPinging = pingingId === host.id
  const lastPing = host.pings[0]
  const status = host.lastStatus

  return (
    <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-navy-600 dark:bg-navy-700/50">
      <div className="flex items-center gap-3">
        {status === "UP" ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : status === "DOWN" ? (
          <WifiOff className="h-4 w-4 text-red-500" />
        ) : (
          <Server className="h-4 w-4 text-neutral-400" />
        )}
        <div>
          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{host.nombre}</span>
          <span className="ml-2 text-xs text-neutral-500">{host.ip}</span>
          {host.detalle && <span className="ml-2 text-xs text-neutral-400">({host.detalle})</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {lastPing && lastPing.latencia !== null && (
          <span className="text-xs text-neutral-500">{lastPing.latencia}ms</span>
        )}
        {host.lastPingAt && (
          <span className="text-xs text-neutral-400">{new Date(host.lastPingAt).toLocaleString("es-AR")}</span>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPing(host.id, host.ip)}
          disabled={isPinging}
          title="Ping ahora"
        >
          <Radio className={`h-4 w-4 ${isPinging ? "animate-pulse text-blue-500" : ""}`} />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onEdit(host)} title="Editar">
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(host.id)} title="Eliminar">
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  )
}
