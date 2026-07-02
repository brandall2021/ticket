import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Ticket, Plus, Users, FolderOpen, BarChart3 } from "lucide-react"
import { AnimatedSection } from "@/components/animated-section"

export default async function Home() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const user = session.user
  const isAgent = user.role === "ADMIN" || user.role === "AGENT"

  const stats = isAgent
    ? await Promise.all([
        prisma.ticket.count(),
        prisma.ticket.count({ where: { status: { in: ["NUEVO", "ASIGNADO", "EN_PROGRESO", "REABIERTO"] } } }),
        prisma.ticket.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
        prisma.user.count({ where: { role: "CLIENT" } }),
      ])
    : await Promise.all([
        prisma.ticket.count({ where: { clienteId: user.id } }),
        prisma.ticket.count({ where: { clienteId: user.id, status: { in: ["NUEVO", "ASIGNADO", "EN_PROGRESO", "REABIERTO"] } } }),
        prisma.ticket.count({ where: { clienteId: user.id, status: "RESUELTO" } }),
        prisma.ticket.count({ where: { clienteId: user.id, status: "CERRADO" } }),
      ])

  const [total, abiertos, hoy, otros] = stats

  if (isAgent) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">Panel de Control</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <AnimatedSection delay={0}>
            <Card className="card-hover">
              <CardContent className="pt-6 flex items-center gap-3">
                <Ticket size={24} className="text-brand-600" />
                <div>
                  <p className="text-2xl font-bold">{total}</p>
                  <p className="text-sm text-gray-500">Total tickets</p>
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>
          <AnimatedSection delay={60}>
            <Card className="card-hover">
              <CardContent className="pt-6 flex items-center gap-3">
                <Ticket size={24} className="text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{abiertos}</p>
                  <p className="text-sm text-gray-500">Abiertos</p>
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>
          <AnimatedSection delay={120}>
            <Card className="card-hover">
              <CardContent className="pt-6 flex items-center gap-3">
                <BarChart3 size={24} className="text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{hoy}</p>
                  <p className="text-sm text-gray-500">Creados hoy</p>
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>
          <AnimatedSection delay={180}>
            <Card className="card-hover">
              <CardContent className="pt-6 flex items-center gap-3">
                <Users size={24} className="text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{otros}</p>
                  <p className="text-sm text-gray-500">Clientes</p>
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <AnimatedSection delay={80} animation="fade-in">
            <Link href="/tickets">
              <Card className="card-hover cursor-pointer">
                <CardContent className="pt-6 flex items-center gap-3">
                <Ticket size={24} className="text-brand-600" />
                  <div>
                    <h3 className="font-semibold">Ver Tickets</h3>
                    <p className="text-sm text-gray-500">Gestionar tickets</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </AnimatedSection>
          <AnimatedSection delay={140} animation="fade-in">
            <Link href="/admin">
              <Card className="card-hover cursor-pointer">
                <CardContent className="pt-6 flex items-center gap-3">
                  <FolderOpen size={24} className="text-green-600" />
                  <div>
                    <h3 className="font-semibold">Administrar</h3>
                    <p className="text-sm text-gray-500">Usuarios y categorías</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </AnimatedSection>
          <AnimatedSection delay={200} animation="fade-in">
            <Link href="/tickets/nuevo">
              <Card className="card-hover cursor-pointer">
                <CardContent className="pt-6 flex items-center gap-3">
                  <Plus size={24} className="text-purple-600" />
                  <div>
                    <h3 className="font-semibold">Nuevo Ticket</h3>
                    <p className="text-sm text-gray-500">Crear ticket de soporte</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </AnimatedSection>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">Mis Tickets</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <AnimatedSection delay={0}>
          <Card className="card-hover">
            <CardContent className="pt-6 flex items-center gap-3">
              <Ticket size={24} className="text-brand-600" />
              <div>
                <p className="text-2xl font-bold">{total}</p>
                <p className="text-sm text-gray-500">Totales</p>
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>
        <AnimatedSection delay={60}>
          <Card className="card-hover">
            <CardContent className="pt-6 flex items-center gap-3">
              <Ticket size={24} className="text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{abiertos}</p>
                <p className="text-sm text-gray-500">Abiertos</p>
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>
        <AnimatedSection delay={120}>
          <Card className="card-hover">
            <CardContent className="pt-6 flex items-center gap-3">
              <Ticket size={24} className="text-green-600" />
              <div>
                <p className="text-2xl font-bold">{otros}</p>
                <p className="text-sm text-gray-500">Resueltos</p>
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>
        <AnimatedSection delay={180}>
          <Card className="card-hover">
            <CardContent className="pt-6 flex items-center gap-3">
              <Ticket size={24} className="text-gray-600" />
              <div>
                <p className="text-2xl font-bold">{hoy}</p>
                <p className="text-sm text-gray-500">Cerrados</p>
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AnimatedSection delay={80} animation="fade-in">
          <Link href="/tickets">
            <Card className="card-hover cursor-pointer">
              <CardContent className="pt-6 flex items-center gap-3">
                <Ticket size={24} className="text-brand-600" />
                <div>
                  <h3 className="font-semibold">Mis Tickets</h3>
                  <p className="text-sm text-gray-500">Ver y dar seguimiento</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </AnimatedSection>
        <AnimatedSection delay={140} animation="fade-in">
          <Link href="/tickets/nuevo">
            <Card className="card-hover cursor-pointer">
              <CardContent className="pt-6 flex items-center gap-3">
                <Plus size={24} className="text-purple-600" />
                <div>
                  <h3 className="font-semibold">Nuevo Ticket</h3>
                  <p className="text-sm text-gray-500">Abrir un ticket de soporte</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </AnimatedSection>
      </div>
    </div>
  )
}
