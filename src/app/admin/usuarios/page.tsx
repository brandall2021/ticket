"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Key, ToggleLeft, ToggleRight, Trash2, Shuffle, Mail, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface Usuario {
  id: string
  name: string
  email: string
  role: string
  activo: boolean
  lastLogin: string | null
  createdAt: string
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })
}

function formatDateTime(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })
}

function generatePassword(length = 12) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export default function AdminUsuariosPage() {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("CLIENT")
  const [notificar, setNotificar] = useState(true)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")

  const [passwordUserId, setPasswordUserId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [reenviandoId, setReenviandoId] = useState<string | null>(null)

  useEffect(() => {
    fetchUsuarios()
  }, [])

  async function fetchUsuarios() {
    const res = await fetch("/api/admin/usuarios")
    const data = await res.json()
    setUsuarios(data)
    setLoading(false)
  }

  function handleGeneratePassword() {
    setPassword(generatePassword())
  }

  function handleGenerateNewPassword() {
    setNewPassword(generatePassword())
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError("")

    const res = await fetch("/api/admin/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role, notificar }),
    })

    if (!res.ok) {
      const data = await res.json()
      setCreateError(data.error || "Error al crear usuario")
      setCreating(false)
      return
    }

    setName("")
    setEmail("")
    setPassword("")
    setRole("CLIENT")
    setNotificar(true)
    setCreating(false)
    fetchUsuarios()
  }

  async function toggleActivo(user: Usuario) {
    const res = await fetch(`/api/admin/usuarios/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !user.activo }),
    })
    if (res.ok) fetchUsuarios()
  }

  async function changeRole(user: Usuario, newRole: string) {
    const res = await fetch(`/api/admin/usuarios/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    })
    if (res.ok) fetchUsuarios()
  }

  async function handleChangePassword(userId: string) {
    setChangingPassword(true)
    const res = await fetch(`/api/admin/usuarios/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    })
    if (res.ok) {
      setPasswordUserId(null)
      setNewPassword("")
    }
    setChangingPassword(false)
  }

  async function handleReenviar(userId: string) {
    setReenviandoId(userId)
    await fetch(`/api/admin/usuarios/${userId}/reenviar`, { method: "POST" })
    setReenviandoId(null)
  }

  async function handleDelete(userId: string) {
    const res = await fetch(`/api/admin/usuarios/${userId}`, {
      method: "DELETE",
    })
    if (res.ok) {
      setDeletingId(null)
      fetchUsuarios()
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-6 h-8 w-32 animate-pulse rounded bg-neutral-200 dark:bg-navy-700" />
        <div className="rounded-lg border border-neutral-200 p-6 dark:border-navy-700">
          <div className="mb-4 h-6 w-36 animate-pulse rounded bg-neutral-200 dark:bg-navy-700" />
          <div className="h-10 w-full animate-pulse rounded bg-neutral-200 dark:bg-navy-700" />
        </div>
        <div className="mt-6 rounded-lg border border-neutral-200 p-6 dark:border-navy-700">
          <div className="mb-4 h-6 w-44 animate-pulse rounded bg-neutral-200 dark:bg-navy-700" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-full animate-pulse rounded bg-neutral-200 dark:bg-navy-700" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Usuarios</h1>
        <Button variant="outline" size="sm" onClick={() => router.push("/admin")}>
          Volver
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crear Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
            <div className="min-w-[160px] flex-1 space-y-1">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" required />
            </div>
            <div className="min-w-[180px] flex-1 space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" required />
            </div>
            <div className="min-w-[140px] flex-1 space-y-1">
              <Label htmlFor="pass">Contraseña</Label>
              <div className="flex gap-1">
                <Input id="pass" type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6" required minLength={6} className="flex-1" />
                <Button type="button" variant="outline" size="sm" className="h-9 w-9 shrink-0" onClick={handleGeneratePassword} title="Generar contraseña aleatoria">
                  <Shuffle className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="w-32 space-y-1">
              <Label htmlFor="role">Rol</Label>
              <Select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="CLIENT">Cliente</option>
                <option value="AGENT">Agente</option>
                <option value="ADMIN">Admin</option>
              </Select>
            </div>
            <label className="flex items-center gap-2 pb-1 text-sm text-neutral-600 dark:text-neutral-400 cursor-pointer">
              <input type="checkbox" checked={notificar} onChange={(e) => setNotificar(e.target.checked)} className="rounded border-neutral-300" />
              <Mail className="h-4 w-4" />
              Notificar por email
            </label>
            <Button type="submit" disabled={creating}>
              <Plus className="h-4 w-4" />
              {creating ? "Creando..." : "Crear"}
            </Button>
          </form>
          {createError && <p className="mt-2 text-sm text-red-500">{createError}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          {usuarios.length === 0 ? (
            <p className="text-sm text-neutral-500">No hay usuarios registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-neutral-500 dark:border-navy-700">
                    <th className="pb-3 pr-4 font-medium">Nombre</th>
                    <th className="pb-3 pr-4 font-medium">Email</th>
                    <th className="pb-3 pr-4 font-medium">Rol</th>
                    <th className="pb-3 pr-4 font-medium">Estado</th>
                    <th className="pb-3 pr-4 font-medium">Creado</th>
                    <th className="pb-3 pr-4 font-medium">Último Login</th>
                    <th className="pb-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((user) => (
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">{user.name}</td>
                      <td className="py-3 pr-4 text-neutral-500">{user.email}</td>
                      <td className="py-3 pr-4">
                        <select
                          value={user.role}
                          onChange={(e) => changeRole(user, e.target.value)}
                          className="rounded-md border border-neutral-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                          <option value="CLIENT">Cliente</option>
                          <option value="AGENT">Agente</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={user.activo ? "success" : "outline"}>
                          {user.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-neutral-500">{formatDate(user.createdAt)}</td>
                      <td className="py-3 pr-4 text-neutral-500 text-xs">{formatDateTime(user.lastLogin)}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleActivo(user)}
                            className="flex items-center gap-1 text-sm text-neutral-500 transition-colors hover:text-brand-600"
                          >
                            {user.activo ? <ToggleRight className="h-5 w-5 text-green-500" /> : <ToggleLeft className="h-5 w-5 text-neutral-400" />}
                          </button>

                          {passwordUserId === user.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="text"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Nueva contraseña"
                                className="h-7 w-36 text-xs"
                                minLength={6}
                              />
                              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleGenerateNewPassword}>
                                <Shuffle className="h-3 w-3" />
                                Aleatoria
                              </Button>
                              <Button size="sm" className="h-7 text-xs" onClick={() => handleChangePassword(user.id)} disabled={changingPassword || !newPassword}>
                                Guardar
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setPasswordUserId(null); setNewPassword("") }}>
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPasswordUserId(user.id)}
                              className="text-neutral-500 transition-colors hover:text-brand-600"
                              title="Cambiar contraseña"
                            >
                              <Key className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleReenviar(user.id)}
                            disabled={reenviandoId === user.id}
                            className="text-neutral-500 transition-colors hover:text-brand-600 disabled:opacity-50"
                            title="Reenviar credenciales"
                          >
                            <Send className="h-4 w-4" />
                          </button>

                          {deletingId === user.id ? (
                            <div className="flex items-center gap-1">
                              <Button size="sm" className="h-7 text-xs bg-red-600 hover:bg-red-700" onClick={() => handleDelete(user.id)}>
                                Confirmar
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setDeletingId(null)}>
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeletingId(user.id)}
                              className="text-neutral-500 transition-colors hover:text-red-600"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
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
