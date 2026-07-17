import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { pingMultiple } from "@/lib/ping"
import { sendEmail, hostDownEmail, hostRecoveredEmail } from "@/lib/email"
import { createNotificationsForRole } from "@/lib/notifications"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return runCronCheck()
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return runCronCheck()
}

async function runCronCheck() {
  const hosts = await prisma.monitorHost.findMany({
    where: { activo: true },
    include: { grupo: true },
  })

  if (hosts.length === 0) {
    return NextResponse.json({ total: 0, message: "No hay hosts activos" })
  }

  const previousStatusMap = new Map(hosts.map(h => [h.ip, h.lastStatus]))

  const ipToHost = new Map(hosts.map(h => [h.ip, h]))
  const results = await pingMultiple(hosts.map(h => h.ip))

  const notifications: string[] = []
  const pings: { hostId: string; host: string; ip: string; exitoso: boolean; latencia: number | null }[] = []

  for (const [ip, result] of results) {
    const host = ipToHost.get(ip)
    if (!host) continue

    const oldStatus = previousStatusMap.get(ip)
    const newStatus = result.exitoso ? "UP" : "DOWN"

    await prisma.monitorPing.create({
      data: {
        exitoso: result.exitoso,
        latencia: result.latencia,
        timeout: result.timeout,
        detalle: result.detalle,
        hostId: host.id,
      },
    })

    await prisma.monitorHost.update({
      where: { id: host.id },
      data: {
        lastStatus: newStatus,
        lastPingAt: new Date(),
      },
    })

    pings.push({ hostId: host.id, host: host.nombre, ip, exitoso: result.exitoso, latencia: result.latencia })

    const statusChanged = oldStatus !== newStatus
    if (statusChanged && host.notificarAdmin) {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN", activo: true },
        select: { id: true, email: true, name: true },
      })

      if (admins.length > 0) {
        const fecha = new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })
        const url = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/admin/monitor`
        const grupo = host.grupo?.nombre || null

        for (const admin of admins) {
          try {
            if (newStatus === "DOWN" && (oldStatus === "UP" || oldStatus === null)) {
              const email = hostDownEmail({ nombre: host.nombre, ip: host.ip, detalle: host.detalle, grupo, fecha, url })
              await sendEmail({ to: admin.email, subject: email.subject, html: email.html })
              notifications.push(`${host.nombre} DOWN -> ${admin.email}`)

              await prisma.notification.create({
                data: {
                  usuarioId: admin.id,
                  tipo: "monitor",
                  titulo: "Host caído",
                  mensaje: `${host.nombre} (${host.ip}) está DOWN${grupo ? ` - Grupo: ${grupo}` : ""}`,
                  url,
                },
              }).catch(() => {})
            } else if (newStatus === "UP" && oldStatus === "DOWN") {
              const email = hostRecoveredEmail({ nombre: host.nombre, ip: host.ip, detalle: host.detalle, grupo, fecha, url })
              await sendEmail({ to: admin.email, subject: email.subject, html: email.html })
              notifications.push(`${host.nombre} UP -> ${admin.email}`)

              await prisma.notification.create({
                data: {
                  usuarioId: admin.id,
                  tipo: "monitor",
                  titulo: "Host recuperado",
                  mensaje: `${host.nombre} (${host.ip}) está UP${grupo ? ` - Grupo: ${grupo}` : ""}`,
                  url,
                },
              }).catch(() => {})
            }
          } catch (err) {
            console.error(`Error sending email for ${host.nombre}:`, err)
          }
        }
      }
    }
  }

  return NextResponse.json({
    total: pings.length,
    notifications,
    timestamp: new Date().toISOString(),
  })
}
