import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function POST(req: NextRequest) {
  const authResult = await requireAuth()
  if (authResult.error) return authResult.error

  const formData = await req.formData()
  const files = formData.getAll("archivos") as File[]

  if (files.length === 0) {
    return NextResponse.json({ error: "No se enviaron archivos" }, { status: 400 })
  }

  const uploaded: { nombre: string; url: string }[] = []

  for (const file of files) {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const ext = path.extname(file.name)
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
    const dir = path.join(process.cwd(), "public", "uploads")
    const filepath = path.join(dir, filename)

    await mkdir(dir, { recursive: true })
    await writeFile(filepath, buffer)

    uploaded.push({
      nombre: file.name,
      url: `/uploads/${filename}`,
    })
  }

  return NextResponse.json({ archivos: uploaded })
}