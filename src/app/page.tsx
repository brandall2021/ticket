import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DashboardClient } from "./dashboard-client"

export default async function HomePage() {
  const session = await auth()

  if (!session?.user) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Helpdesk</h1>
          <p className="mt-2 text-[var(--text-muted)]">Sistema de tickets de soporte</p>
          <a
            href="/login"
            className="mt-6 inline-flex h-11 items-center rounded-xl bg-brand-600 px-6 text-sm font-medium text-white transition-all hover:bg-brand-700 active:scale-[0.98]"
          >
            Ingresar
          </a>
        </div>
      </div>
    )
  }

  const [ticketCount, instructivoCount, notaCount, linkCount] = await Promise.all([
    prisma.ticket.count({ where: { clienteId: session.user.id! } }),
    prisma.instructivo.count({ where: { activo: true } }),
    prisma.note.count({ where: { autorId: session.user.id! } }),
    prisma.link.count({ where: { activo: true } }),
  ])

  const recentTickets = await prisma.ticket.findMany({
    where: { clienteId: session.user.id! },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, titulo: true, createdAt: true, status: true },
  })

  return (
    <DashboardClient
      ticketCount={ticketCount}
      instructivoCount={instructivoCount}
      notaCount={notaCount}
      linkCount={linkCount}
      recentTickets={recentTickets.map(t => ({
        id: t.id,
        title: t.titulo,
        date: new Date(t.createdAt).toLocaleDateString("es-AR"),
        type: "ticket" as const,
        href: "/tickets/",
      }))}
      userName={session.user.name ?? "Usuario"}
    />
  )
}
