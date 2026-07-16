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

  const instructivos = [
    { title: "Aguas de Catamarca", imageUrl: "https://play-lh.googleusercontent.com/ycQTMpUcxbNxTHmQqrZ9c00kJbOgR-xB67nTSshto9sFSJCWlNswByOHoM2rYgxWDo5b", url: "https://interno.recuperocrediticio.com/?page_id=2601" },
    { title: "Aguas de Santiago", imageUrl: "https://www.aguasdesantiago.com.ar/storage/settings/July2025/aMY53V86EsbQ2JQbwlIJ.png", url: "https://interno.recuperocrediticio.com/?page_id=3172" },
    { title: "Amargot", imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2026/02/amargot.jpg", url: "https://interno.recuperocrediticio.com/?page_id=2121" },
    { title: "Asociart", imageUrl: "https://asociart.com.ar/wp-content/uploads/2022/07/xLogos-Asociart-01-e1656642063573-1.png.pagespeed.ic_.OAPgxbOqnt-1.png", url: "https://interno.recuperocrediticio.com/?page_id=2123" },
    { title: "Banco Columbia", imageUrl: "https://secure.bancocolumbia.com.ar/web/assets/images/layout/logo.svg", url: "https://interno.recuperocrediticio.com/?page_id=2857" },
    { title: "Castillo MT", imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2026/02/castillo.jpg", url: "https://interno.recuperocrediticio.com/?page_id=2629" },
    { title: "Castillo Prejudicial", imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2026/02/castillo.jpg", url: "https://interno.recuperocrediticio.com/?page_id=2557" },
    { title: "Castillo Residual", imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2026/02/castillo.jpg", url: "https://interno.recuperocrediticio.com/?page_id=2655" },
    { title: "CCC", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQvev_ZMUZTaSdCzEEzSncY7-OjlPmEdhdxzA&s", url: "https://interno.recuperocrediticio.com/?page_id=2688" },
    { title: "Credicuotas", imageUrl: "https://www.credicuotas.com.ar/static/media/logoCredicuotas.c8e5ff57023db5d2d581.png", url: "https://interno.recuperocrediticio.com/?page_id=2129" },
    { title: "Credimas", imageUrl: "https://images.seeklogo.com/logo-png/32/1/credimas-logo-png_seeklogo-325348.png", url: "https://interno.recuperocrediticio.com/?page_id=3334" },
    { title: "Credimas MT", imageUrl: "https://images.seeklogo.com/logo-png/32/1/credimas-logo-png_seeklogo-325348.png", url: "https://interno.recuperocrediticio.com/?page_id=2131" },
    { title: "Credito Argentino", imageUrl: "https://d31dn7nfpuwjnm.cloudfront.net/images/valoraciones/0044/3440/C%C3%B3mo_saber_cu%C3%A1nto_debo_en_credito_argentino.png?1623658025", url: "https://interno.recuperocrediticio.com/?page_id=2065" },
    { title: "Cristal Cash", imageUrl: "https://s3.amazonaws.com/test.digiventures/landing/6e9fda11-2249-4bad-a789-4f0dd88c7053.png", url: "https://interno.recuperocrediticio.com/?page_id=2133" },
    { title: "Cross Meli Colombia", imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2026/02/mercado_cross_mco-4.png", url: "https://interno.recuperocrediticio.com/?page_id=3015" },
    { title: "Cross Meli Uruguay", imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2026/02/meli-uruguay.png", url: "https://interno.recuperocrediticio.com/?page_id=3119" },
    { title: "Edesur", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e5/Edesur_logo22.png", url: "https://interno.recuperocrediticio.com/?page_id=2135" },
    { title: "Experta ART", imageUrl: "https://www.experta.com.ar/art/wp-content/uploads/2019/07/group-2.png", url: "https://interno.recuperocrediticio.com/?page_id=2139" },
    { title: "Financie Rapido", imageUrl: "https://comercios.finrap.com.ar/Imagenes/Logo_Full.PNG", url: "https://interno.recuperocrediticio.com/?page_id=2572" },
    { title: "Foto Multa", imageUrl: "https://media.puntal.com.ar/p/00ab1fd618b1d0dd6ea4bf89a07110c5/adjuntos/270/imagenes/001/594/0001594645/1200x0/smart/multas.jpg", url: "https://interno.recuperocrediticio.com/?page_id=3221" },
    { title: "Gran Cooperativa", imageUrl: "https://www.grancoop.com.ar/assets/_Images/logo/logo-horizontal-color.png", url: "https://interno.recuperocrediticio.com/?page_id=2927" },
    { title: "Luquin Tardía", imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2026/02/luquin.jpg", url: "https://interno.recuperocrediticio.com/?page_id=2549" },
    { title: "Luquin MT", imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2026/02/luquin.jpg", url: "https://interno.recuperocrediticio.com/?page_id=2281" },
    { title: "Mercado Pago Consumer Digital", imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2026/02/mercado.webp", url: "https://interno.recuperocrediticio.com/?page_id=1966" },
    { title: "Mercado Pago Consumer Tardia", imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2026/02/mercado.webp", url: "https://interno.recuperocrediticio.com/?page_id=3362" },
    { title: "Mutual Pilarenses", imageUrl: "https://mutualpilarenses.com.ar/assets/img/logos/logo-black.png", url: "https://interno.recuperocrediticio.com/?page_id=2594" },
    { title: "N&F", imageUrl: "https://www.nfcapitalmarkets.com.ar/assets/_Images/logo.png", url: "https://interno.recuperocrediticio.com/?page_id=2969" },
    { title: "Parque de la Paz", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ9_4MCNz1N78ePa9b02Nv76yJWUr3_eFYHn2utBc451NTcEbMrsTyXhIq0CC68v5DsDCU&usqp=CAU", url: "https://interno.recuperocrediticio.com/?page_id=3134" },
    { title: "Prevencion ART", imageUrl: "https://www.prevencionart.com.ar/resources/ART_color.svg", url: "https://interno.recuperocrediticio.com/?page_id=2826" },
    { title: "Providers", imageUrl: "https://www.providers.com.ar/wp-content/uploads/2022/02/cropped-logoProv.png", url: "https://interno.recuperocrediticio.com/?page_id=2738" },
    { title: "Sancor Salud", imageUrl: "https://repo.sancorsalud.com.ar/webinstitucional/assets/images/logo_web_SSGMP-01.svg", url: "https://interno.recuperocrediticio.com/?page_id=1927" },
    { title: "SAT", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR5K2lnFrd-ooqwidt6QgdRWeWvluohBYBjMg&s", url: "https://interno.recuperocrediticio.com/?page_id=3191" },
    { title: "Supercanal", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/19/Logo_Supercanal_Clasico.png", url: "https://interno.recuperocrediticio.com/?page_id=2387" },
    { title: "Swiss Medical", imageUrl: "https://www.ccres.org.ar/site/wp-content/uploads/2023/11/LOGO-Swiss-Medical-Medicina-Privada-3.jpg", url: "https://interno.recuperocrediticio.com/?page_id=2148" },
    { title: "Tarjeta Qida", imageUrl: "https://tuquejasuma.com/media/images/entity117569_square.png", url: "https://interno.recuperocrediticio.com/?page_id=3145" },
    { title: "Tejada Hnos", imageUrl: "https://lh6.googleusercontent.com/proxy/bDLoGAAi0_jt35IrSfqUtFfvvbVdx2JabLTHKjvFrX9h0g492dsp8t3tVmpUtAH_r1XTqZXyDyfBNG_Uck-xh6o_FKHFRG0jZh3wz5qXCIl4C3-RayMD2h3qG2gdzDXle0oLIM0", url: "https://interno.recuperocrediticio.com/?page_id=2398" },
    { title: "Vallejo Calzados", imageUrl: "https://http2.mlstatic.com/D_NQ_NP_905107-MLA74959241787_032024-O.webp", url: "https://interno.recuperocrediticio.com/?page_id=2583" },
    { title: "Oscar Barbieri MT", imageUrl: "https://www.fundaciondeltucuman.com/wp-content/uploads/2025/03/oscar-barbieri-logo-azul.png", url: "https://interno.recuperocrediticio.com/?page_id=3463" },
    { title: "Accicom", imageUrl: "https://www.cislo.com.ar/img/accicom.jpg", url: "https://interno.recuperocrediticio.com/?page_id=3653" },
    { title: "Oscar Barbieri Tardía", imageUrl: "https://www.fundaciondeltucuman.com/wp-content/uploads/2025/03/oscar-barbieri-logo-azul.png", url: "https://interno.recuperocrediticio.com/?page_id=3545" },
  ]

  for (const inst of instructivos) {
    const existing = await prisma.instructivo.findFirst({ where: { title: inst.title } })
    if (!existing) {
      await prisma.instructivo.create({ data: inst })
    }
  }
  console.log(`  ✓ ${instructivos.length} instructivos`)

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
