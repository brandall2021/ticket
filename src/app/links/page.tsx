import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { AnimatedSection } from "@/components/animated-section"
import Image from "next/image"
import { ExternalLink } from "lucide-react"

export default async function LinksPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const links = await prisma.link.findMany({
    where: { activo: true },
    orderBy: { title: "asc" },
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        Links importantes
      </h1>
      <p className="mb-8 text-neutral-500 dark:text-neutral-400">
        Accesos directos a sistemas y herramientas
      </p>

      {links.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 py-16 text-center text-neutral-400 dark:border-navy-600">
          No hay links disponibles
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {links.map((link, i) => (
            <AnimatedSection key={link.id} delay={i * 60}>
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
      )}
    </div>
  )
}
