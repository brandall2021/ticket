import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Ticket, Users, FolderOpen, BarChart3, Link2, UserCog, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ROLES_ADMIN_AGENT_EDITOR, ROLES_ADMIN_AGENT } from "@/lib/constants"

export default async function AdminDashboard() {
  const session = await auth()
  if (!session?.user || !ROLES_ADMIN_AGENT_EDITOR.includes(session.user.role)) {
    redirect("/login")
  }

  const isAdminOrAgent = ROLES_ADMIN_AGENT.includes(session.user.role)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [totalTickets, ticketsAbiertos, ticketsHoy, agentes, clientes] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({
      where: { status: { in: ["NUEVO", "EN_CURSO", "EN_ESPERA"] } },
    }),
    prisma.ticket.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
    prisma.user.count({ where: { role: "AGENT" } }),
    prisma.user.count({ where: { role: "CLIENT" } }),
  ])

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Dashboard</h1>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/internos">
            <Button variant="outline" size="sm">
              <UserCog className="h-4 w-4" />
              Internos
            </Button>
          </Link>
          <Link href="/admin/links">
            <Button variant="outline" size="sm">
              <Link2 className="h-4 w-4" />
              Links
            </Button>
          </Link>
          <Link href="/admin/instructivos">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4" />
              Instructivos
            </Button>
          </Link>
          {isAdminOrAgent && (
            <>
              <Link href="/admin/usuarios">
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4" />
                  Usuarios
                </Button>
              </Link>
              <Link href="/admin/categorias">
                <Button variant="outline" size="sm">
                  <FolderOpen className="h-4 w-4" />
                  Categorías
                </Button>
              </Link>
            </>
          )}
          <Link href="/tickets">
            <Button variant="outline" size="sm">
              <Ticket className="h-4 w-4" />
              Tickets
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Total Tickets</CardTitle>
            <Ticket className="h-5 w-5 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalTickets}</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Tickets Abiertos</CardTitle>
            <BarChart3 className="h-5 w-5 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{ticketsAbiertos}</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Tickets Hoy</CardTitle>
            <Ticket className="h-5 w-5 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{ticketsHoy}</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Agentes</CardTitle>
            <Users className="h-5 w-5 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{agentes}</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Clientes</CardTitle>
            <Users className="h-5 w-5 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{clientes}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
