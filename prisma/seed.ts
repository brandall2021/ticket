import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  const password = await bcrypt.hash("admin123", 12)

  const admin = await prisma.user.upsert({
    where: { email: "admin@helpdesk.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@helpdesk.com",
      password,
      role: "ADMIN",
    },
  })
  console.log(`  ✓ Admin: ${admin.email}`)

  const agent = await prisma.user.upsert({
    where: { email: "agente@helpdesk.com" },
    update: {},
    create: {
      name: "Agente Soporte",
      email: "agente@helpdesk.com",
      password,
      role: "AGENT",
    },
  })
  console.log(`  ✓ Agente: ${agent.email}`)

  const client = await prisma.user.upsert({
    where: { email: "cliente@helpdesk.com" },
    update: {},
    create: {
      name: "Cliente Demo",
      email: "cliente@helpdesk.com",
      password,
      role: "CLIENT",
    },
  })
  console.log(`  ✓ Cliente: ${client.email}`)

  const categorias = [
    { nombre: "Soporte Técnico", color: "#3B82F6" },
    { nombre: "Facturación", color: "#10B981" },
    { nombre: "Cuenta", color: "#F59E0B" },
    { nombre: "Bug", color: "#EF4444" },
    { nombre: "Solicitud de Función", color: "#8B5CF6" },
  ]

  for (const cat of categorias) {
    await prisma.categoria.upsert({
      where: { nombre: cat.nombre },
      update: {},
      create: cat,
    })
  }
  console.log(`  ✓ ${categorias.length} categorías`)

  const stockCategorias = [
    { nombre: "Tóner", color: "#2563EB" },
    { nombre: "Mouse", color: "#16A34A" },
    { nombre: "Teclado", color: "#9333EA" },
    { nombre: "Fuente", color: "#EA580C" },
    { nombre: "Monitor", color: "#0891B2" },
    { nombre: "Cable", color: "#DC2626" },
    { nombre: "Disco", color: "#4F46E5" },
  ]

  for (const cat of stockCategorias) {
    await prisma.stockCategoria.upsert({
      where: { nombre: cat.nombre },
      update: {},
      create: cat,
    })
  }
  console.log(`  ✓ ${stockCategorias.length} categorías de stock`)

  console.log("")
  console.log("  Credenciales:")
  console.log(`  Admin:  admin@helpdesk.com / admin123`)
  console.log(`  Agente: agente@helpdesk.com / admin123`)
  console.log(`  Cliente: cliente@helpdesk.com / admin123`)
  console.log("")
  console.log("✅ Seed complete")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
