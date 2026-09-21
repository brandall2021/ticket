import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Search, ChevronRight } from "lucide-react"
import { WikiIcon } from "@/lib/wiki-icons"

interface WikiSearchParams {
  searchParams?: Promise<{ q?: string }>
}

interface ArticuloConCategoria {
  id: string
  titulo: string
  resumen: string | null
  categoria: { id: string; nombre: string; color: string; icono: string }
}

export default async function WikiPage({ searchParams }: WikiSearchParams) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const params = searchParams ? await searchParams : undefined
  const q = params?.q?.trim() || ""

  const articulos = (await prisma.articuloWiki.findMany({
    where: {
      activo: true,
      ...(q
        ? {
            OR: [
              { titulo: { contains: q, mode: "insensitive" } },
              { resumen: { contains: q, mode: "insensitive" } },
              { contenido: { contains: q, mode: "insensitive" } },
              { categoria: { nombre: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: { categoria: true },
    orderBy: [{ categoria: { orden: "asc" } }, { categoria: { nombre: "asc" } }, { titulo: "asc" }],
  })) as ArticuloConCategoria[]

  const porCategoria = new Map<string, ArticuloConCategoria[]>()
  for (const a of articulos) {
    const arr = porCategoria.get(a.categoria.id) || []
    arr.push(a)
    porCategoria.set(a.categoria.id, arr)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">Wiki</h1>
      <p className="mb-6 text-neutral-500 dark:text-neutral-400">
        Base de conocimiento interna del sistema
      </p>

      <form className="mb-8 flex gap-2" method="get">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar artículos..."
            className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-navy-700 dark:bg-navy-800 dark:text-neutral-100"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          Buscar
        </button>
      </form>

      {articulos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 py-16 text-center text-neutral-400 dark:border-navy-600">
          {q ? "No se encontraron artículos para la búsqueda" : "Todavía no hay artículos en el wiki"}
        </div>
      ) : (
        <div className="space-y-8">
          {[...porCategoria.entries()].map(([categoriaId, items]) => {
            const cat = items[0].categoria
            return (
              <section key={categoriaId}>
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${cat.color}1a`, color: cat.color }}
                  >
                    <WikiIcon name={cat.icono} className="h-4 w-4" />
                  </span>
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{cat.nombre}</h2>
                  <span className="text-xs text-neutral-400">{items.length}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map(a => (
                    <a
                      key={a.id}
                      href={`/wiki/${a.id}`}
                      className="group block"
                    >
                      <Card className="card-hover h-full transition-all duration-200">
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                            {a.titulo}
                          </h3>
                          {a.resumen && (
                            <p className="mt-1 line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400">
                              {a.resumen}
                            </p>
                          )}
                          <span
                            className="mt-3 inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{ backgroundColor: `${cat.color}1a`, color: cat.color }}
                          >
                            {cat.nombre}
                          </span>
                          <ChevronRight className="mt-2 h-4 w-4 text-neutral-300 transition-transform group-hover:translate-x-1 group-hover:text-brand-400 dark:text-navy-500" />
                        </CardContent>
                      </Card>
                    </a>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}