import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CalendarClock } from "lucide-react"
import { WikiIcon } from "@/lib/wiki-icons"

export default async function WikiArticuloPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params

  const articulo = await prisma.articuloWiki.findUnique({
    where: { id },
    include: { categoria: true },
  })
  if (!articulo || !articulo.activo) notFound()

  const otros = await prisma.articuloWiki.findMany({
    where: { categoriaId: articulo.categoriaId, id: { not: articulo.id }, activo: true },
    orderBy: { titulo: "asc" },
    take: 8,
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/wiki"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition-colors hover:text-brand-600 dark:text-neutral-400 dark:hover:text-brand-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al Wiki
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${articulo.categoria.color}1a`, color: articulo.categoria.color }}
        >
          <WikiIcon name={articulo.categoria.icono} className="h-5 w-5" />
        </span>
        <div>
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ backgroundColor: `${articulo.categoria.color}1a`, color: articulo.categoria.color }}
          >
            {articulo.categoria.nombre}
          </span>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{articulo.titulo}</h1>
      <div className="mb-6 mt-2 flex items-center gap-2 text-xs text-neutral-400 dark:text-navy-400">
        <CalendarClock className="h-3.5 w-3.5" />
        Actualizado el {articulo.updatedAt.toLocaleDateString("es-AR")}
      </div>

      {articulo.contenido ? (
        <article
          className="prose prose-neutral max-w-none dark:prose-invert prose-headings:text-neutral-900 prose-p:text-neutral-700 prose-strong:text-neutral-900 prose-a:text-brand-600 prose-li:text-neutral-700 dark:prose-headings:text-neutral-100 dark:prose-p:text-neutral-300 dark:prose-strong:text-neutral-100 dark:prose-a:text-brand-400 dark:prose-li:text-neutral-300"
          dangerouslySetInnerHTML={{ __html: articulo.contenido }}
        />
      ) : (
        <div className="rounded-lg border border-dashed border-neutral-300 py-16 text-center text-neutral-400 dark:border-navy-600">
          Este artículo no tiene contenido aún. Un administrador o agente puede editarlo desde el panel.
        </div>
      )}

      {otros.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Otros artículos de {articulo.categoria.nombre}
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {otros.map(a => (
              <Link
                key={a.id}
                href={`/wiki/${a.id}`}
                className="rounded-lg border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-700 transition-colors hover:border-brand-500/50 hover:text-brand-600 dark:border-navy-700 dark:text-neutral-300 dark:hover:border-brand-400/50 dark:hover:text-brand-400"
              >
                {a.titulo}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}