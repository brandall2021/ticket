import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ExternalLink } from "lucide-react"

export default async function InstructivoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params

  const item = await prisma.instructivo.findUnique({ where: { id } })
  if (!item) notFound()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/instructivos"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition-colors hover:text-brand-600 dark:text-neutral-400 dark:hover:text-brand-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Instructivos
      </Link>

      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start">
        {item.imageUrl && (
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-navy-700 sm:h-32 sm:w-32">
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              className="object-contain p-2"
              unoptimized
            />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {item.title}
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {item.description}
          </p>
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Link externo
            </a>
          )}
        </div>
      </div>

      {item.contenido ? (
        <article
          className="prose prose-neutral max-w-none dark:prose-invert prose-headings:text-neutral-900 prose-p:text-neutral-700 prose-strong:text-neutral-900 prose-a:text-brand-600 prose-li:text-neutral-700 dark:prose-headings:text-neutral-100 dark:prose-p:text-neutral-300 dark:prose-strong:text-neutral-100 dark:prose-a:text-brand-400 dark:prose-li:text-neutral-300"
          dangerouslySetInnerHTML={{ __html: item.contenido }}
        />
      ) : (
        <div className="rounded-lg border border-dashed border-neutral-300 py-16 text-center text-neutral-400 dark:border-navy-600">
          Este instructivo no tiene contenido aún. Un administrador puede editarlo desde el panel.
        </div>
      )}
    </div>
  )
}