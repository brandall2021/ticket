import { prisma } from "@/lib/prisma"

interface CreateNotification {
  usuarioId: string
  tipo: string
  titulo: string
  mensaje: string
  url?: string
}

export async function createNotification(data: CreateNotification) {
  return prisma.notification.create({ data })
}

export async function createNotificationsForRole(
  role: string,
  tipo: string,
  titulo: string,
  mensaje: string,
  url?: string,
  excludeUserId?: string
) {
  const users = await prisma.user.findMany({
    where: { role: role as never, activo: true, ...(excludeUserId ? { id: { not: excludeUserId } } : {}) },
    select: { id: true },
  })

  if (users.length === 0) return []

  return prisma.notification.createMany({
    data: users.map((u) => ({
      usuarioId: u.id,
      tipo,
      titulo,
      mensaje,
      url: url || null,
    })),
  })
}

export async function createNotificationsForUsers(
  userIds: string[],
  tipo: string,
  titulo: string,
  mensaje: string,
  url?: string
) {
  if (userIds.length === 0) return []

  return prisma.notification.createMany({
    data: userIds.map((id) => ({
      usuarioId: id,
      tipo,
      titulo,
      mensaje,
      url: url || null,
    })),
  })
}
