import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"
import { requireAuth } from "@/lib/api-auth"

const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".zip": "application/zip",
  ".doc": "application/msword",
  ".xls": "application/vnd.ms-excel",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}

/** Sólo nombres generados por el servidor: sin separadores ni "..". */
const SAFE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,120}$/

export async function GET(_req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const authResult = await requireAuth()
  if (authResult.error) return authResult.error

  const { name } = await params
  if (!SAFE_NAME.test(name) || name.includes("..")) {
    return NextResponse.json({ error: "Nombre de archivo inválido" }, { status: 400 })
  }

  const directory = path.join(process.cwd(), "uploads")
  const filePath = path.join(directory, name)

  // Defensa extra contra path traversal.
  if (!filePath.startsWith(directory + path.sep)) {
    return NextResponse.json({ error: "Nombre de archivo inválido" }, { status: 400 })
  }

  try {
    const data = await readFile(filePath)
    const extension = path.extname(name).toLowerCase()

    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": MIME_TYPES[extension] ?? "application/octet-stream",
        "Content-Disposition": `inline; filename="${name}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=300",
      },
    })
  } catch {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 })
  }
}
