import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Prisma } from "@prisma/client"

export default async function InternosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { q } = await searchParams

  const where: Prisma.InternoWhereInput = {}
  if (q) {
    where.OR = [
      { asesor: { contains: q, mode: "insensitive" } },
      { turno: { contains: q, mode: "insensitive" } },
      { campania: { contains: q, mode: "insensitive" } },
      { supervision: { contains: q, mode: "insensitive" } },
      { interno: { contains: q, mode: "insensitive" } },
      { rol: { contains: q, mode: "insensitive" } },
    ]
  }

  const internos = await prisma.interno.findMany({
    where,
    orderBy: [{ turno: "asc" }, { asesor: "asc" }],
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Listado de Internos
        </h1>
        <p className="mt-1 text-neutral-500 dark:text-neutral-400">
          {internos.length} registros
        </p>
      </div>

      <div className="mb-6">
        <form className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Buscar por asesor, campaña, interno..."
            className="pl-9"
          />
        </form>
      </div>

      {internos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-neutral-500">
            No se encontraron registros
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-navy-700">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-navy-700 dark:bg-navy-800">
                <th className="px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-300">Asesor</th>
                <th className="px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-300">Turno</th>
                <th className="px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-300">Campaña</th>
                <th className="px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-300">Supervisión</th>
                <th className="px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-300">Int.</th>
                <th className="px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-300">Rol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-navy-700">
              {internos.map((item) => (
                <tr
                  key={item.id}
                  className="bg-white transition-colors hover:bg-neutral-50 dark:bg-navy-800 dark:hover:bg-navy-700/50"
                >
                  <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">{item.asesor}</td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{item.turno}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-neutral-600 dark:text-neutral-400" title={item.campania}>{item.campania}</td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{item.supervision}</td>
                  <td className="px-4 py-3 font-mono text-neutral-900 dark:text-neutral-100">{item.interno}</td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{item.rol}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
