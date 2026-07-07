import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { AnimatedSection } from "@/components/animated-section"
import Image from "next/image"
import { ExternalLink } from "lucide-react"

interface LinkItem {
  title: string
  description: string
  url: string
  imageUrl: string
}

const links: LinkItem[] = [
  {
    title: "Omnia",
    description: "SISTEMA DE CONTROL DE ASISTENCIA",
    url: "https://dashboards-ostengo.omnia.la/login",
    imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2021/12/WhatsApp-Image-2021-12-28-at-3.25.00-PM.jpeg",
  },
  {
    title: "WhatsApp RRHH",
    description: "Atención RRHH: 543813325895",
    url: "https://api.whatsapp.com/send/?phone=543813325895&text&app_absent=0",
    imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2021/12/unnamed-300x188.jpg",
  },
  {
    title: "CLICK2CALL",
    description: "ADJUNTO TELEPROM",
    url: "https://192.168.35.2:9091/",
    imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2021/12/CLICK.jpg",
  },
  {
    title: "Project Performance",
    description: "SISTEMA DE CONTROL",
    url: "http://192.168.35.48/Performance/login.aspx",
    imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2022/01/performance.jpg",
  },
  {
    title: "Ip Web",
    description: "MONITOREO ONLINE",
    url: "http://192.168.35.21:3309/#/OpersStatus",
    imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2022/01/teleprom-argentina-sa-1748B97B02BDA0C6thumbnail.jpg",
  },
  {
    title: "Invenio",
    description: "CHATCENTER",
    url: "https://inveniomonitor.robbu.com.br/acesso",
    imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2022/01/invenio-1.jpg",
  },
  {
    title: "Mora Seguridad",
    description: "ADJUNTO MORA",
    url: "https://ostengo-seg.moracero.com.ar/gamlogin.aspx",
    imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2022/01/infinium-it.jpg",
  },
  {
    title: "Okeybot",
    description: "SISTEMA DE CHAT",
    url: "https://app.okeybot.com/user/login",
    imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2022/01/okeybot-1.jpg",
  },
  {
    title: "Tacob",
    description: "REPORTE DE GESTIÓN",
    url: "http://tacob.net/login",
    imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2022/01/2022-01-06-12_37_47-tacob_otg.jpg",
  },
  {
    title: "Omnia Admin",
    description: "CONTROL DE ASISTENCIAS (ADMIN)",
    url: "https://admin-ostengo.omnia.la/login",
    imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2021/12/WhatsApp-Image-2021-12-28-at-3.25.00-PM.jpeg",
  },
  {
    title: "Whatscupon",
    description: "ENVÍO DE MENSAJES",
    url: "https://whatscupon.com/login",
    imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2022/01/paintstain-ink-splash-manchadetinta-tinta-whatsapp-ink-graphics-art-green-light-transparent-png-675863.png",
  },
  {
    title: "Recibos",
    description: "RECIBOS ELECTRÓNICOS",
    url: "https://app.reciboselectronicos.com/login.htm",
    imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2022/01/Captura.png",
  },
  {
    title: "PreveNET",
    description: "SISTEMA DE PREVENCIÓN ART",
    url: "https://prevenet-pro.gruposancorseguros.com/",
    imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2022/02/PreveNET.jpg",
  },
  {
    title: "Engage",
    description: "SISTEMA DE MERCADOPAGO",
    url: "https://engage.adminml.com/engage5/EngageAgent/Login.aspx",
    imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2022/02/Engage2-1.jpg",
  },
  {
    title: "Autogestión",
    description: "GENERACIÓN DE CUPONES Y MÁS",
    url: "https://ostengo.moracero.com.ar/wpnlogin.aspx",
    imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2022/05/recupero-1.jpg",
  },
]

const externalUrls = links.map(l => l.url)

export default async function LinksPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        Links importantes
      </h1>
      <p className="mb-8 text-neutral-500 dark:text-neutral-400">
        Accesos directos a sistemas y herramientas
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {links.map((link, i) => (
          <AnimatedSection key={link.title} delay={i * 60}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <Card className="card-hover overflow-hidden transition-all duration-200">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100 dark:bg-navy-700">
                  <Image
                    src={link.imageUrl}
                    alt={link.title}
                    fill
                    className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                    unoptimized
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {link.title}
                  </h3>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {link.description}
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 transition-colors group-hover:text-brand-700 dark:text-brand-400 dark:group-hover:text-brand-300">
                    <ExternalLink className="h-3.5 w-3.5" />
                    LINK
                  </div>
                </CardContent>
              </Card>
            </a>
          </AnimatedSection>
        ))}
      </div>
    </div>
  )
}
