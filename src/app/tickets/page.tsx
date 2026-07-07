import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Search, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Prisma } from "@prisma/client"
import { STATUS_COLORS, PRIORIDAD_COLORS, STATUS_LABELS } from "@/lib/constants"

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; prioridad?: string; q?: string; desde?: string; hasta?: string; page?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { status, prioridad, q, desde, hasta, page: pageStr } = await searchParams
  const isAdminOrAgent =
    session.user.role === "ADMIN" || session.user.role === "AGENT"

  const page = Math.max(1, parseInt(pageStr || "1"))
  const limit = 20
  const skip = (page - 1) * limit

  const where: Prisma.TicketWhereInput = {}
  if (!isAdminOrAgent) {
    where.clienteId = session.user.id
  }
  if (status) where.status = status as Prisma.TicketWhereInput["status"]
  if (prioridad) where.prioridad = prioridad as Prisma.TicketWhereInput["prioridad"]
  if (q) where.titulo = { contains: q, mode: "insensitive" }
  if (desde || hasta) {
    where.createdAt = {}
    if (desde) (where.createdAt as Record<string, unknown>).gte = new Date(desde)
    if (hasta) (where.createdAt as Record<string, unknown>).lte = new Date(hasta + "T23:59:59.999Z")
  }

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        cliente: { select: { name: true, email: true } },
        agente: { select: { name: true } },
        categoria: { select: { nombre: true, color: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.ticket.count({ where }),
  ])

  const pages = Math.ceil(total / limit)

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      NUEVO: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      EN_CURSO: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      EN_ESPERA: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
      CERRADO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    }
    return map[s] || ""
  }

  const prioridadColor = (p: string) => {
    const map: Record<string, string> = {
      BAJA: "bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400",
      MEDIA: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      ALTA: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      CRITICA: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    }
    return map[p] || ""
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Tickets
          <span className="ml-2 text-base font-normal text-neutral-400">
            ({total})
          </span>
        </h1>
        <Link href="/tickets/nuevo">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo
          </Button>
        </Link>
      </div>

      <div className="mb-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-navy-700 dark:bg-navy-800">
        <form className="flex flex-wrap items-end gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              name="q"
              defaultValue={q}
              placeholder="Buscar por título..."
              className="pl-9"
            />
          </div>
          <Select name="status" defaultValue={status || ""}>
            <option value="">Todos los estados</option>
            <option value="NUEVO">Nuevo</option>
            <option value="EN_CURSO">En Curso</option>
            <option value="EN_ESPERA">En Espera</option>
            <option value="CERRADO">Cerrado</option>
          </Select>
          <Select name="prioridad" defaultValue={prioridad || ""}>
            <option value="">Todas las prioridades</option>
            <option value="BAJA">Baja</option>
            <option value="MEDIA">Media</option>
            <option value="ALTA">Alta</option>
            <option value="CRITICA">Crítica</option>
          </Select>
          <Input type="date" name="desde" defaultValue={desde} className="w-36" />
          <Input type="date" name="hasta" defaultValue={hasta} className="w-36" />
          <Button type="submit" variant="secondary" size="sm">
            <Search className="h-4 w-4" />
            Filtrar
          </Button>
          {(status || prioridad || q || desde || hasta) && (
            <Link href="/tickets">
              <Button type="button" variant="ghost" size="sm">
                Limpiar
              </Button>
            </Link>
          )}
        </form>
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 py-16 text-center text-neutral-400 dark:border-navy-600">
          No hay tickets
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-navy-700">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:border-navy-700 dark:bg-navy-800 dark:text-neutral-400">
                  <th className="px-4 py-3">Título</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Prioridad</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Agente</th>
                  <th className="px-4 py-3">Creado</th>
                  <th className="px-4 py-3">Actualizado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-navy-700">
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="bg-white transition-colors hover:bg-neutral-50 dark:bg-navy-800 dark:hover:bg-navy-700/50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="font-medium text-neutral-900 hover:text-brand-600 dark:text-neutral-100 dark:hover:text-brand-400"
                      >
                        {ticket.titulo}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(ticket.status)}`}>
                        {STATUS_LABELS[ticket.status] || ticket.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${prioridadColor(ticket.prioridad)}`}>
                        {ticket.prioridad}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                      {ticket.categoria ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: ticket.categoria.color }}
                          />
                          {ticket.categoria.nombre}
                        </span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                      {ticket.cliente.name}
                    </td>
                    <td className="px-4 py-3">
                      {ticket.agente ? (
                        <span className="text-neutral-600 dark:text-neutral-400">
                          {ticket.agente.name}
                        </span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-neutral-500">
                      {formatDate(ticket.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-neutral-500">
                      {formatDate(ticket.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-neutral-500">
                Página {page} de {pages}
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={`/tickets?page=${page - 1}${status ? `&status=${status}` : ""}${prioridad ? `&prioridad=${prioridad}` : ""}${q ? `&q=${q}` : ""}${desde ? `&desde=${desde}` : ""}${hasta ? `&hasta=${hasta}` : ""}`}
                  >
                    <Button variant="outline" size="sm" className="gap-1">
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Anterior
                    </Button>
                  </Link>
                )}
                {page < pages && (
                  <Link
                    href={`/tickets?page=${page + 1}${status ? `&status=${status}` : ""}${prioridad ? `&prioridad=${prioridad}` : ""}${q ? `&q=${q}` : ""}${desde ? `&desde=${desde}` : ""}${hasta ? `&hasta=${hasta}` : ""}`}
                  >
                    <Button variant="outline" size="sm" className="gap-1">
                      Siguiente
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
