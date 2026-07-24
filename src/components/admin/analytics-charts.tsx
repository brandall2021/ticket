"use client"

import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

const STATUS_LABELS: Record<string, string> = {
  NUEVO: "Nuevo",
  EN_CURSO: "En Curso",
  EN_ESPERA: "En Espera",
  CERRADO: "Cerrado",
}

const STATUS_COLORS = ["#3b82f6", "#f59e0b", "#6b7280", "#22c55e"]

const PRIORIDAD_LABELS: Record<string, string> = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
  CRITICA: "Crítica",
}

const PRIORIDAD_COLORS = ["#6b7280", "#3b82f6", "#f59e0b", "#ef4444"]

interface Stats {
  ticketsByStatus: { status: string; count: number }[]
  ticketsByPriority: { prioridad: string; count: number }[]
  ticketsByCategory: { categoria: string; count: number }[]
  ticketsTrend: { fecha: string; count: number }[]
  agentWorkload: { agente: string; count: number }[]
  avgResolutionTime: number
}

export function AnalyticsCharts() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar estadísticas")
        return res.json()
      })
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-20 text-center text-sm text-red-500">{error}</div>
    )
  }

  if (!stats) return null

  const statusData = stats.ticketsByStatus.map((r) => ({
    name: STATUS_LABELS[r.status] || r.status,
    value: r.count,
  }))

  const priorityData = stats.ticketsByPriority.map((r) => ({
    name: PRIORIDAD_LABELS[r.prioridad] || r.prioridad,
    value: r.count,
  }))

  const categoryData = stats.ticketsByCategory.map((r) => ({
    name: r.categoria,
    value: r.count,
  }))

  const trendData = stats.ticketsTrend.map((r) => ({
    fecha: r.fecha.slice(5),
    tickets: r.count,
  }))

  const agentData = stats.agentWorkload.map((r) => ({
    name: r.agente,
    tickets: r.count,
  }))

  const formatMinutes = (mins: number) => {
    if (mins < 60) return `${Math.round(mins)}min`
    const h = Math.floor(mins / 60)
    const m = Math.round(mins % 60)
    return m > 0 ? `${h}h ${m}min` : `${h}h`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
          Analytics
        </h2>
        <span className="text-sm text-[var(--text-muted)]">
          Tiempo promedio de resolución:{" "}
          <strong className="text-neutral-900 dark:text-neutral-100">
            {formatMinutes(stats.avgResolutionTime)}
          </strong>
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tickets por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" name="Tickets" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tickets por Prioridad</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {priorityData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={PRIORIDAD_COLORS[i % PRIORIDAD_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tickets por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="py-10 text-center text-sm text-[var(--text-muted)]">
                Sin datos de categorías
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar
                    dataKey="value"
                    name="Tickets"
                    fill="#8b5cf6"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tendencia (últimos 30 días)</CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length === 0 ? (
              <p className="py-10 text-center text-sm text-[var(--text-muted)]">
                Sin datos en los últimos 30 días
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="tickets"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Carga de Trabajo por Agente</CardTitle>
          </CardHeader>
          <CardContent>
            {agentData.length === 0 ? (
              <p className="py-10 text-center text-sm text-[var(--text-muted)]">
                Sin agentes asignados
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={agentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="tickets"
                    name="Tickets"
                    fill="#f59e0b"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
