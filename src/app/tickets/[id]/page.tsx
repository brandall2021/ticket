import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Clock, User, Tag, CalendarDays, Monitor, MapPin, Paperclip, MessageSquare, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TicketActions } from "@/components/ticket-actions"
import { CommentForm } from "@/components/comment-form"
import { AssignAgent } from "@/components/assign-agent"
import { DeleteTicket } from "@/components/delete-ticket"
import { STATUS_COLORS, PRIORIDAD_COLORS, STATUS_LABELS } from "@/lib/constants"

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatShortDate(date: Date) {
  return new Date(date).toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const statusBadgeStyle: Record<string, string> = {
  NUEVO: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  EN_CURSO: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  EN_ESPERA: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-700",
  CERRADO: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
}

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      cliente: { select: { name: true, email: true } },
      agente: { select: { name: true, email: true, id: true } },
      categoria: { select: { nombre: true, color: true } },
      comments: {
        where: session.user.role === "CLIENT" ? { internal: false } : {},
        include: { autor: { select: { name: true, image: true } } },
        orderBy: { createdAt: "asc" },
      },
      attachments: true,
    },
  })

  if (!ticket) notFound()

  if (
    session.user.role === "CLIENT" &&
    ticket.clienteId !== session.user.id
  ) {
    redirect("/tickets")
  }

  const isAdminOrAgent =
    session.user.role === "ADMIN" || session.user.role === "AGENT"

  return (
    <div className="mx-auto max-w-5xl p-6">
      <Link
        href="/tickets"
        className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 transition-colors hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a tickets
      </Link>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            {ticket.titulo}
          </h1>
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold ${statusBadgeStyle[ticket.status] || ""}`}>
              {STATUS_LABELS[ticket.status] || ticket.status}
            </span>
            <span className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold ${statusBadgeStyle[ticket.prioridad] || "bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-navy-700 dark:text-neutral-300 dark:border-navy-600"}`}>
              {ticket.prioridad}
            </span>
            {ticket.categoria && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-0.5 text-xs font-medium text-neutral-600 dark:border-navy-600 dark:bg-navy-800 dark:text-neutral-300">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: ticket.categoria.color }}
                />
                {ticket.categoria.nombre}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-5">
              <div
                className="prose prose-sm max-w-none text-neutral-700 dark:prose-invert dark:text-neutral-300"
                dangerouslySetInnerHTML={{ __html: ticket.descripcion }}
              />
            </CardContent>
          </Card>

          {ticket.solucion && (
            <Card className="border-green-200 dark:border-green-800">
              <CardContent className="flex gap-3 p-5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <div>
                  <h4 className="mb-1 text-sm font-semibold text-green-800 dark:text-green-300">Solución</h4>
                  <p className="text-sm text-green-700 dark:text-green-400">{ticket.solucion}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-navy-700">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4" />
                Comentarios
                {ticket.comments.length > 0 && (
                  <span className="text-sm font-normal text-neutral-400">
                    ({ticket.comments.length})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-neutral-100 dark:divide-navy-700">
                {ticket.comments.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-neutral-400">
                    Sin comentarios aún.
                  </p>
                ) : (
                  ticket.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`px-5 py-4 ${
                        comment.internal
                          ? "border-l-4 border-amber-400 bg-amber-50/50 dark:border-amber-500 dark:bg-amber-900/10"
                          : ""
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                          {(comment.autor.name || "U")[0]}
                        </span>
                        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {comment.autor.name || "Usuario"}
                        </span>
                        {comment.internal && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            Interno
                          </span>
                        )}
                        <span className="text-xs text-neutral-400">
                          {formatShortDate(comment.createdAt)}
                        </span>
                      </div>
                      <div
                        className="prose prose-sm ml-8 max-w-none text-neutral-700 dark:prose-invert dark:text-neutral-300"
                        dangerouslySetInnerHTML={{ __html: comment.contenido }}
                      />
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-neutral-100 px-5 py-4 dark:border-navy-700">
                <CommentForm ticketId={ticket.id} userRole={session.user.role} />
              </div>
            </CardContent>
          </Card>

          {ticket.attachments.length > 0 && (
            <Card>
              <CardHeader className="border-b border-neutral-100 px-5 py-4 dark:border-navy-700">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Paperclip className="h-4 w-4" />
                  Adjuntos ({ticket.attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-2">
                  {ticket.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-sm text-brand-600 hover:underline dark:text-brand-400"
                    >
                      {attachment.nombre}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="border-b border-neutral-100 px-4 py-3 dark:border-navy-700">
              <CardTitle className="text-sm font-semibold">Detalles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 text-sm">
              <div className="flex items-start gap-2">
                <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-400">Cliente</p>
                  <p className="text-neutral-900 dark:text-neutral-100">{ticket.cliente.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-400">Agente</p>
                  <p className="text-neutral-900 dark:text-neutral-100">
                    {ticket.agente?.name || <span className="text-neutral-400">Sin asignar</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Tag className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-400">Categoría</p>
                  <p className="text-neutral-900 dark:text-neutral-100">
                    {ticket.categoria?.nombre || <span className="text-neutral-400">—</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-400">Creado</p>
                  <p className="text-neutral-900 dark:text-neutral-100">{formatShortDate(ticket.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-400">Actualizado</p>
                  <p className="text-neutral-900 dark:text-neutral-100">{formatShortDate(ticket.updatedAt)}</p>
                </div>
              </div>
              {ticket.ubicacion && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-400">Ubicación</p>
                    <p className="text-neutral-900 dark:text-neutral-100">{ticket.ubicacion}</p>
                  </div>
                </div>
              )}
              {ticket.ipPc && (
                <div className="flex items-start gap-2">
                  <Monitor className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-400">IP de PC</p>
                    <p className="font-mono text-neutral-900 dark:text-neutral-100">{ticket.ipPc}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {isAdminOrAgent && (
            <Card>
              <CardHeader className="border-b border-neutral-100 px-4 py-3 dark:border-navy-700">
                <CardTitle className="text-sm font-semibold">Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                <div>
                  <p className="mb-1.5 text-xs font-medium text-neutral-500">Estado</p>
                  <TicketActions
                    ticketId={ticket.id}
                    currentStatus={ticket.status}
                  />
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-neutral-500">Asignación</p>
                  <AssignAgent ticketId={ticket.id} currentAgentId={ticket.agente?.id || null} />
                </div>
                {session.user.role === "ADMIN" && (
                  <div className="border-t border-neutral-100 pt-3 dark:border-navy-700">
                    <DeleteTicket ticketId={ticket.id} ticketTitulo={ticket.titulo} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
