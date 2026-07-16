"use client"

import { StatsCard } from "@/components/dashboard/stats-card"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { PageTransition } from "@/components/page-transition"
import { Ticket, FileText, StickyNote, Link2, Plus } from "lucide-react"
import Link from "next/link"

interface DashboardProps {
  ticketCount: number
  instructivoCount: number
  notaCount: number
  linkCount: number
  recentTickets: { id: string; title: string; date: string; type: "ticket"; href: string }[]
  userName: string
}

export function DashboardClient({
  ticketCount, instructivoCount, notaCount, linkCount, recentTickets, userName
}: DashboardProps) {
  return (
    <PageTransition>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">
            Hola, {userName}
          </h1>
          <p className="mt-1 text-[var(--text-muted)]">Resumen de tu helpdesk</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Mis Tickets" value={ticketCount} icon={Ticket} color="blue" delay={0} />
          <StatsCard title="Instructivos" value={instructivoCount} icon={FileText} color="emerald" delay={0.05} />
          <StatsCard title="Mis Notas" value={notaCount} icon={StickyNote} color="gold" delay={0.1} />
          <StatsCard title="Links" value={linkCount} icon={Link2} color="red" delay={0.15} />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentActivity items={recentTickets} />
          </div>
          <div className="card-glass p-6">
            <h2 className="mb-4 text-sm font-semibold">Accesos Rápidos</h2>
            <div className="space-y-2">
              <Link href="/tickets/nuevo" className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-[var(--bg-tertiary)]">
                <Plus className="h-4 w-4 text-brand-500" />
                <span className="text-sm font-medium">Nuevo Ticket</span>
              </Link>
              <Link href="/instructivos" className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-[var(--bg-tertiary)]">
                <FileText className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium">Ver Instructivos</span>
              </Link>
              <Link href="/notas" className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-[var(--bg-tertiary)]">
                <StickyNote className="h-4 w-4 text-gold-500" />
                <span className="text-sm font-medium">Escribir Nota</span>
              </Link>
              <Link href="/calculadora" className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-[var(--bg-tertiary)]">
                <span className="text-sm font-medium ml-7">Calculadora</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
