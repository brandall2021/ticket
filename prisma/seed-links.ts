import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const links = [
  { title: "Omnia", description: "SISTEMA DE CONTROL DE ASISTENCIA", url: "https://dashboards-ostengo.omnia.la/login", imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2021/12/WhatsApp-Image-2021-12-28-at-3.25.00-PM.jpeg" },
  { title: "WhatsApp RRHH", description: "Atención RRHH: 543813325895", url: "https://api.whatsapp.com/send/?phone=543813325895&text&app_absent=0", imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2021/12/unnamed-300x188.jpg" },
  { title: "CLICK2CALL", description: "ADJUNTO TELEPROM", url: "https://192.168.35.2:9091/", imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2021/12/CLICK.jpg" },
  { title: "Project Performance", description: "SISTEMA DE CONTROL", url: "http://192.168.35.48/Performance/login.aspx", imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2022/01/performance.jpg" },
  { title: "Ip Web", description: "MONITOREO ONLINE", url: "http://192.168.35.21:3309/#/OpersStatus", imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2022/01/teleprom-argentina-sa-1748B97B02BDA0C6thumbnail.jpg" },
  { title: "Invenio", description: "CHATCENTER", url: "https://inveniomonitor.robbu.com.br/acesso", imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2022/01/invenio-1.jpg" },
  { title: "Mora Seguridad", description: "ADJUNTO MORA", url: "https://ostengo-seg.moracero.com.ar/gamlogin.aspx", imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2022/01/infinium-it.jpg" },
  { title: "Okeybot", description: "SISTEMA DE CHAT", url: "https://app.okeybot.com/user/login", imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2022/01/okeybot-1.jpg" },
  { title: "Tacob", description: "REPORTE DE GESTIÓN", url: "http://tacob.net/login", imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2022/01/2022-01-06-12_37_47-tacob_otg.jpg" },
  { title: "Omnia Admin", description: "CONTROL DE ASISTENCIAS (ADMIN)", url: "https://admin-ostengo.omnia.la/login", imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2021/12/WhatsApp-Image-2021-12-28-at-3.25.00-PM.jpeg" },
  { title: "Whatscupon", description: "ENVÍO DE MENSAJES", url: "https://whatscupon.com/login", imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2022/01/paintstain-ink-splash-manchadetinta-tinta-whatsapp-ink-graphics-art-green-light-transparent-png-675863.png" },
  { title: "Recibos", description: "RECIBOS ELECTRÓNICOS", url: "https://app.reciboselectronicos.com/login.htm", imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2022/01/Captura.png" },
  { title: "PreveNET", description: "SISTEMA DE PREVENCIÓN ART", url: "https://prevenet-pro.gruposancorseguros.com/", imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2022/02/PreveNET.jpg" },
  { title: "Engage", description: "SISTEMA DE MERCADOPAGO", url: "https://engage.adminml.com/engage5/EngageAgent/Login.aspx", imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2022/02/Engage2-1.jpg" },
  { title: "Autogestión", description: "GENERACIÓN DE CUPONES Y MÁS", url: "https://ostengo.moracero.com.ar/wpnlogin.aspx", imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2022/05/recupero-1.jpg" },
]

async function main() {
  console.log("Limpiando tabla Link...")
  await prisma.link.deleteMany()
  console.log(`Insertando ${links.length} links...`)
  for (const link of links) {
    await prisma.link.create({ data: link })
  }
  console.log("Seed completado!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
