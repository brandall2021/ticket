import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Search, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"

const statusColors: Record<
  string,
  "default" | "secondary" | "destructive" | "success" | "warning" | "outline"
> = {
  NUEVO: "default",
  ASIGNADO: "secondary",
  EN_PROGRESO: "warning",
  RESUELTO: "success",
  CERRADO: "outline",
  REABIERTO: "destructive",
}

const prioridadColors: Record<
  string,
  "default" | "secondary" | "destructive" | "success" | "warning" | "outline"
> = {
  BAJA: "secondary",
  MEDIA: "default",
  ALTA: "warning",
  CRITICA: "destructive",
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })
}

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; prioridad?: string; q?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { status, prioridad, q } = await searchParams
  const isAdminOrAgent =
    session.user.role === "ADMIN" || session.user.role === "AGENT"

  const where: Record<string, unknown> = {}
  if (!isAdminOrAgent) {
    where.clienteId = session.user.id
  }
  if (status) where.status = status
  if (prioridad) where.prioridad = prioridad
  if (q) where.titulo = { contains: q, mode: "insensitive" }

  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      cliente: { select: { name: true, email: true } },
      agente: { select: { name: true } },
      categoria: { select: { nombre: true, color: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Tickets</h1>
        <Link href="/tickets/nuevo">
          <Button>
            <Plus className="h-4 w-4" />
            Nuevo Ticket
          </Button>
        </Link>
      </div>

      <form className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Buscar por título..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-3">
          <Select name="status" defaultValue={status || ""}>
            <option value="">Todos los estados</option>
            <option value="NUEVO">Nuevo</option>
            <option value="ASIGNADO">Asignado</option>
            <option value="EN_PROGRESO">En Progreso</option>
            <option value="RESUELTO">Resuelto</option>
            <option value="CERRADO">Cerrado</option>
            <option value="REABIERTO">Reabierto</option>
          </Select>
          <Select name="prioridad" defaultValue={prioridad || ""}>
            <option value="">Todas las prioridades</option>
            <option value="BAJA">Baja</option>
            <option value="MEDIA">Media</option>
            <option value="ALTA">Alta</option>
            <option value="CRITICA">Crítica</option>
          </Select>
        </div>
        <Button type="submit" variant="secondary" size="sm">
          <Search className="h-4 w-4" />
          Filtrar
        </Button>
      </form>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-neutral-500">
            No hay tickets
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
              <Card className="transition-colors hover:bg-neutral-50 dark:hover:bg-navy-700/50">
                <CardContent className="flex items-start justify-between p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold">{ticket.titulo}</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant={statusColors[ticket.status] || "default"}
                      >
                        {ticket.status}
                      </Badge>
                      <Badge
                        variant={
                          prioridadColors[ticket.prioridad] || "default"
                        }
                      >
                        {ticket.prioridad}
                      </Badge>
                      {ticket.categoria && (
                        <Badge
                          style={{
                            backgroundColor: ticket.categoria.color,
                            color: "#fff",
                          }}
                        >
                          {ticket.categoria.nombre}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-neutral-500">
                    <p>{ticket.cliente.name}</p>
                    {ticket.agente && <p>→ {ticket.agente.name}</p>}
                    {ticket.ubicacion && <p className="text-xs">{ticket.ubicacion}</p>}
                    <p>{formatDate(ticket.createdAt)}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
