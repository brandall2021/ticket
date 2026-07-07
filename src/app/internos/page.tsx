import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { AnimatedSection } from "@/components/animated-section"
import Image from "next/image"
import { ExternalLink } from "lucide-react"

interface InternoItem {
  title: string
  description: string
  url: string
  imageUrl: string
}

const items: InternoItem[] = [
  {
    title: "Internos Asesores",
    description: "LISTA DE INTERNOS DE ASESORES EN GENERAL",
    url: "https://docs.google.com/spreadsheets/d/1z7gKXODzpzIUw7PUbNDBu2BJlAbrRmHn/edit?usp=sharing&ouid=114083574672008375115&rtpof=true&sd=true",
    imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/2022/03/Internos.jpg",
  },
  {
    title: "Internos de la Empresa",
    description: "LISTA DE INTERNOS DE OTRAS AREAS",
    url: "https://docs.google.com/spreadsheets/d/1r7h8CFMvOIoBh3aypdkMy5dxeAzVLLYW/edit?usp=sharing&ouid=114083574672008375115&rtpof=true&sd=true",
    imageUrl: "https://interno.recuperocrediticio.com/wp-content/uploads/elementor/thumbs/Internos-importantes-plyqutk0nkgejbchkwe9kpwhrcqci59ao7qt6nfjgu.jpg",
  },
]

export default async function InternosPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        Listado de Internos
      </h1>
      <p className="mb-8 text-neutral-500 dark:text-neutral-400">
        Lista de internos de la empresa por área
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item, i) => (
          <AnimatedSection key={item.title} delay={i * 60}>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <Card className="card-hover overflow-hidden transition-all duration-200">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100 dark:bg-navy-700">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                    unoptimized
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {item.description}
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
