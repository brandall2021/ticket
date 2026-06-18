"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Key, ToggleLeft, ToggleRight } from "lucide-react"
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
  createdAt: string
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })
}

export default function AdminUsuariosPage() {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("CLIENT")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")

  const [passwordUserId, setPasswordUserId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    fetchUsuarios()
  }, [])

  async function fetchUsuarios() {
    const res = await fetch("/api/admin/usuarios")
    const data = await res.json()
    setUsuarios(data)
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError("")

    const res = await fetch("/api/admin/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
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

  if (loading) {
    return <div className="mx-auto max-w-5xl p-6 text-neutral-500">Cargando...</div>
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
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
              <Input id="pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6" required minLength={6} />
            </div>
            <div className="w-32 space-y-1">
              <Label htmlFor="role">Rol</Label>
              <Select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="CLIENT">Cliente</option>
                <option value="AGENT">Agente</option>
                <option value="ADMIN">Admin</option>
              </Select>
            </div>
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
                      <td className="py-3 text-neutral-500">{formatDate(user.createdAt)}</td>
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
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Nueva contraseña"
                                className="h-7 w-32 text-xs"
                                minLength={6}
                              />
                              <Button size="sm" className="h-7 text-xs" onClick={() => handleChangePassword(user.id)} disabled={changingPassword || !newPassword}>
                                Guardar
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setPasswordUserId(null); setNewPassword("") }}>
                                X
                              </Button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPasswordUserId(user.id)}
                              className="flex items-center gap-1 text-sm text-neutral-500 transition-colors hover:text-brand-600"
                            >
                              <Key className="h-4 w-4" />
                              Contraseña
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
