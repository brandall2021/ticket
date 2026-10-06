import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import { createNotificationsForRole } from "@/lib/notifications"
import {
  getResource,
  getInterfaces,
  parseUptimeSec,
  formatUptime,
  MikrotikError,
  encryptMikrotikPassword,
  hasMikrotikEncryptionKey,
  isEncryptedMikrotikPassword,
  mikrotikConfigFromRouter,
  wasMikrotikRouterUp,
  getMikrotikAlertCooldownMinutes,
  type MikrotikRouterConfig,
} from "@/lib/mikrotik"

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
  const routers = await prisma.mikrotikRouter.findMany({
    where: { activo: true },
  })

  if (routers.length === 0) {
    return NextResponse.json({ total: 0, message: "No hay routers MikroTik activos" })
  }

  const resultados: Array<{ router: string; ok: boolean; alertas: number; error?: string }> = []
  let alertasCreadas = 0

  for (const router of routers) {
    if (hasMikrotikEncryptionKey() && !isEncryptedMikrotikPassword(router.password)) {
      await prisma.mikrotikRouter.update({
        where: { id: router.id },
        data: { password: encryptMikrotikPassword(router.password) },
      })
    }
    const config: MikrotikRouterConfig = mikrotikConfigFromRouter(router)

    const prevEstado = router.ultimoEstado
    const result: { router: string; ok: boolean; alertas: number; error?: string } = {
      router: router.nombre,
      ok: false,
      alertas: 0,
    }

    try {
      const resource = await getResource(config)
      const uptimeSec = parseUptimeSec(resource.uptime || "")

      await prisma.mikrotikSnapshot.create({
        data: {
          routerId: router.id,
          cpuLoad: resource.cpuLoad,
          freeMemory: resource.freeMemory,
          totalMemory: resource.totalMemory,
          uptimeSec: uptimeSec ?? undefined,
        },
      })

      const interfaces = await getInterfaces(config)
      await prisma.mikrotikTraffic.createMany({
        data: interfaces
          .filter(i => i.rxBytes !== null && i.txBytes !== null)
          .map(i => ({
            routerId: router.id,
            iface: i.name,
            rxBytes: i.rxBytes || 0,
            txBytes: i.txBytes || 0,
            rxPackets: i.rxPackets || 0,
            txPackets: i.txPackets || 0,
          })),
      })

      const alertas = await evaluarAlertas(router.id, router.nombre, resource, interfaces)
      alertasCreadas += alertas
      result.alertas = alertas
      result.ok = true

      const estado = prevEstado === "ERROR" ? "RECUPERADO" : "OK"
      await prisma.mikrotikRouter.update({
        where: { id: router.id },
        data: {
          cpuLoad: resource.cpuLoad,
          freeMemory: resource.freeMemory,
          totalMemory: resource.totalMemory,
          uptime: resource.uptime,
          ultimoEstado: estado,
          ultimoError: null,
          ultimaConexion: new Date(),
        },
      })

      if (estado === "RECUPERADO" && router.notificarAdmin) {
        await notifyAdmin(
          router.nombre,
          `OK`,
          `El router ${router.nombre} (${router.host}) volvió a responder. CPU ${resource.cpuLoad}%, uptime ${formatUptime(uptimeSec)}.`
        )
        alertasCreadas += 1
      }
    } catch (err) {
      const msg = err instanceof MikrotikError ? err.message : err instanceof Error ? err.message : String(err)
      result.error = msg

      await prisma.mikrotikRouter.update({
        where: { id: router.id },
        data: { ultimoEstado: "ERROR", ultimoError: msg, ultimaConexion: new Date() },
      })

      const desdeUp = wasMikrotikRouterUp(prevEstado)
      if (desdeUp && router.notificarAdmin) {
        await prisma.mikrotikAlert.create({
          data: {
            routerId: router.id,
            tipo: "OFFLINE",
            nivel: "CRITICAL",
            mensaje: `Router ${router.nombre} sin conexión API: ${msg}`,
          },
        })
        alertasCreadas += 1

        await notifyAdmin(
          router.nombre,
          `OFFLINE`,
          `El router ${router.nombre} (${router.host}) no responde por API (puerto ${router.apiPort}). Error: ${msg}`
        )
      }
    }

    resultados.push(result)
  }

  return NextResponse.json({
    total: resultados.length,
    alertasCreadas,
    resultados,
    timestamp: new Date().toISOString(),
  })
}

async function evaluarAlertas(
  routerId: string,
  nombre: string,
  resource: Awaited<ReturnType<typeof getResource>>,
  interfaces: Awaited<ReturnType<typeof getInterfaces>>
): Promise<number> {
  let created = 0

  if (resource.cpuLoad !== null && resource.cpuLoad >= 90) {
    if (await createAlertIfDue(routerId, "CPU_ALTA", `${nombre}: CPU al ${resource.cpuLoad}%`)) created += 1
  }

  if (
    resource.freeMemory !== null &&
    resource.totalMemory !== null &&
    resource.totalMemory > 0 &&
    resource.freeMemory / resource.totalMemory < 0.1
  ) {
    if (await createAlertIfDue(routerId, "MEMORIA_BAJA", `${nombre}: menos del 10% de memoria libre`)) created += 1
  }

  for (const iface of interfaces) {
    if (iface.running === false && iface.disabled === false && iface.name !== "all") {
      if (await createAlertIfDue(
        routerId,
        "IFACE_DOWN",
        `${nombre}: interfaz ${iface.name} caída`,
        `interfaz ${iface.name} caída`
      )) created += 1
    }
  }

  return created
}

async function createAlertIfDue(routerId: string, tipo: string, mensaje: string, mensajeClave?: string): Promise<boolean> {
  const minutes = getMikrotikAlertCooldownMinutes()
  const since = new Date(Date.now() - minutes * 60_000)
  const recent = await prisma.mikrotikAlert.findFirst({
    where: {
      routerId,
      tipo,
      createdAt: { gte: since },
      ...(mensajeClave ? { mensaje: { contains: mensajeClave } } : {}),
    },
    select: { id: true },
  })
  if (recent) return false

  await prisma.mikrotikAlert.create({
    data: { routerId, tipo, nivel: "WARNING", mensaje },
  })
  return true
}

async function notifyAdmin(nombre: string, estado: string, mensaje: string) {
  const url = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/admin/mikrotik`
  const fecha = new Date().toLocaleString("es-AR", { timeZone: process.env.TZ || "America/Argentina/Buenos_Aires" })
  const esDown = estado === "OFFLINE"

  await createNotificationsForRole(
    "ADMIN",
    "mikrotik",
    esDown ? "Router MikroTik sin conexión" : `Router MikroTik ${estado}`,
    mensaje,
    url
  ).catch(() => {})

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", activo: true },
    select: { email: true },
  }).catch(() => [])

  for (const admin of admins) {
    const pal = esDown ? "#dc2626" : "#16a34a"
    await sendEmail({
      to: admin.email,
      subject: `${esDown ? "[ALERTA]" : "[INFO]"} ${nombre} - ${estado}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${pal}; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <h2 style="color: white; margin: 0 0 8px 0;">Router ${estado}</h2>
            <p style="margin: 0; color: white; font-weight: 600;">${nombre}</p>
          </div>
          <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 4px 0;">${mensaje}</p>
            <p style="margin: 4px 0; color: #6b7280;">Fecha: ${fecha}</p>
          </div>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: ${pal}; color: white; text-decoration: none; border-radius: 6px;">Ver panel MikroTik</a>
          </div>
        </div>
      `,
    }).catch(err => console.error(`Error sending mikrotik email for ${nombre}:`, err))
  }
}
