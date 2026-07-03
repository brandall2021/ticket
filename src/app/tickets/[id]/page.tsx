import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Paperclip } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TicketActions } from "@/components/ticket-actions"
import { CommentForm } from "@/components/comment-form"
import { AssignAgent } from "@/components/assign-agent"
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
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <Link
        href="/tickets"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a tickets
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-2xl">{ticket.titulo}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant={STATUS_COLORS[ticket.status] || "default"}>
                {STATUS_LABELS[ticket.status] || ticket.status}
              </Badge>
              <Badge
                variant={PRIORIDAD_COLORS[ticket.prioridad] || "default"}
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
        </CardHeader>

        <CardContent className="space-y-4">
          <div
            className="prose prose-sm max-w-none text-neutral-700 dark:prose-invert dark:text-neutral-300"
            dangerouslySetInnerHTML={{ __html: ticket.descripcion }}
          />

          <div className="grid grid-cols-2 gap-4 text-sm text-neutral-500">
            <div>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">Cliente:</span>{" "}
              {ticket.cliente.name}
            </div>
            <div>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">Agente:</span>{" "}
              {ticket.agente?.name || "Sin asignar"}
            </div>
            <div>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">Creado:</span>{" "}
              {formatDate(ticket.createdAt)}
            </div>
            <div>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                Actualizado:
              </span>{" "}
              {formatDate(ticket.updatedAt)}
            </div>
            {ticket.ubicacion && (
              <div>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">Ubicación:</span>{" "}
                {ticket.ubicacion}
              </div>
            )}
            {ticket.ipPc && (
              <div>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">IP de PC:</span>{" "}
                {ticket.ipPc}
              </div>
            )}
          </div>

          {ticket.solucion && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
              <h4 className="mb-1 text-sm font-medium text-green-800 dark:text-green-300">Solución</h4>
              <p className="text-sm text-green-700 dark:text-green-400">{ticket.solucion}</p>
            </div>
          )}

          {isAdminOrAgent && (
            <div className="space-y-4 border-t pt-4">
              <div>
                <h4 className="mb-2 text-sm font-medium">Cambiar estado</h4>
                <TicketActions
                  ticketId={ticket.id}
                  currentStatus={ticket.status}
                />
              </div>
              <div>
                <h4 className="mb-2 text-sm font-medium">Asignar agente</h4>
                <AssignAgent ticketId={ticket.id} currentAgentId={ticket.agente?.id || null} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comentarios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ticket.comments.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Sin comentarios aún.
            </p>
          ) : (
            ticket.comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-lg border border-neutral-100 bg-neutral-50 p-4 dark:border-navy-700 dark:bg-navy-700/50"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {comment.autor.name || "Usuario"}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <div
                  className="prose prose-sm max-w-none text-neutral-700 dark:prose-invert dark:text-neutral-300"
                  dangerouslySetInnerHTML={{ __html: comment.contenido }}
                />
              </div>
            ))
          )}

          <div className="border-t pt-4">
            <CommentForm ticketId={ticket.id} />
          </div>
        </CardContent>
      </Card>

      {ticket.attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Paperclip className="h-4 w-4" />
              Adjuntos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ticket.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-brand-600 hover:underline"
                >
                  {attachment.nombre}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}