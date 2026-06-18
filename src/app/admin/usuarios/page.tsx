import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })
}

export default async function AdminUsuariosPage() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    redirect("/login")
  }

  const usuarios = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, activo: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Usuarios</h1>

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
                  <tr className="border-b text-left text-neutral-500">
                    <th className="pb-3 pr-4 font-medium">Nombre</th>
                    <th className="pb-3 pr-4 font-medium">Email</th>
                    <th className="pb-3 pr-4 font-medium">Rol</th>
                    <th className="pb-3 pr-4 font-medium">Estado</th>
                    <th className="pb-3 font-medium">Creado</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((user) => (
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">{user.name}</td>
                      <td className="py-3 pr-4 text-neutral-500">{user.email}</td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant={
                            user.role === "ADMIN"
                              ? "destructive"
                              : user.role === "AGENT"
                                ? "warning"
                                : "default"
                          }
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={user.activo ? "success" : "outline"}>
                          {user.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="py-3 text-neutral-500">{formatDate(user.createdAt)}</td>
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
