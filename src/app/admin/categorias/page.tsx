import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })
}

export default async function AdminCategoriasPage() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    redirect("/login")
  }

  const categorias = await prisma.categoria.findMany({
    orderBy: { nombre: "asc" },
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Categorías</h1>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Categorías</CardTitle>
        </CardHeader>
        <CardContent>
          {categorias.length === 0 ? (
            <p className="text-sm text-neutral-500">No hay categorías</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-neutral-500">
                    <th className="pb-3 pr-4 font-medium">Nombre</th>
                    <th className="pb-3 pr-4 font-medium">Color</th>
                    <th className="pb-3 pr-4 font-medium">Estado</th>
                    <th className="pb-3 font-medium">Creado</th>
                  </tr>
                </thead>
                <tbody>
                  {categorias.map((cat) => (
                    <tr key={cat.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">{cat.nombre}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-4 w-4 rounded-full border"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="text-neutral-500">{cat.color}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={cat.activo ? "success" : "outline"}>
                          {cat.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="py-3 text-neutral-500">{formatDate(cat.createdAt)}</td>
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
