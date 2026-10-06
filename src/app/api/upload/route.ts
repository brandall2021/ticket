import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { buildUploadArtifact } from "@/lib/upload-utils.js"

export async function POST(req: NextRequest) {
  const authResult = await requireAuth()
  if (authResult.error) return authResult.error

  const declaredSize = Number(req.headers.get("content-length"))
  if (Number.isFinite(declaredSize) && declaredSize > 16 * 1024 * 1024) {
    return NextResponse.json({ error: "Solicitud demasiado grande" }, { status: 413 })
  }
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Formulario invalido" }, { status: 400 })
  }
  const files = formData.getAll("archivos") as File[]

  if (files.length > 5) return NextResponse.json({ error: "Maximo 5 archivos" }, { status: 400 })
  const allowedTypes = new Set([
    "image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf", "text/plain",
    "application/zip", "application/msword", "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ])
  let totalSize = 0
  for (const file of files) {
    if (!(file instanceof File) || !allowedTypes.has(file.type) || /\.(html?|svg|js|exe|bat|cmd|ps1)$/i.test(file.name)) {
      return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 })
    }
    totalSize += file.size
    if (file.size > 5 * 1024 * 1024 || totalSize > 15 * 1024 * 1024) {
      return NextResponse.json({ error: "Maximo 5 MB por archivo y 15 MB por solicitud" }, { status: 413 })
    }
  }

  if (files.length === 0) {
    return NextResponse.json({ error: "No se enviaron archivos" }, { status: 400 })
  }

  const uploaded: { nombre: string; url: string }[] = []

  for (const file of files) {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const artifact = buildUploadArtifact(file, buffer)

    if (artifact.persistToDisk && artifact.filename) {
      const dir = path.join(process.cwd(), "public", "uploads")
      const filepath = path.join(dir, artifact.filename)

      await mkdir(dir, { recursive: true })
      await writeFile(filepath, buffer)
    }

    uploaded.push({
      nombre: artifact.nombre,
      url: artifact.url,
    })
  }

  return NextResponse.json({ archivos: uploaded })
}
