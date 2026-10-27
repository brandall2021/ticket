import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ROLES_ADMIN } from "@/lib/constants"
import { logAudit } from "@/lib/audit"

function escapeSql(val: unknown): string {
  if (val === null || val === undefined) return "NULL"
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE"
  if (typeof val === "number") return String(val)
  if (val instanceof Date) return `'${val.toISOString()}'`
  const str = String(val).replace(/'/g, "''")
  return `'${str}'`
}

function generateInsert(table: string, rows: Record<string, unknown>[], columns: string[]): string {
  if (rows.length === 0) return ""
  const lines: string[] = []
  lines.push(`DELETE FROM "${table}";`)
  for (const row of rows) {
    const vals = columns.map(c => escapeSql(row[c]))
    lines.push(`INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(", ")}) VALUES (${vals.join(", ")});`)
  }
  return lines.join("\n")
}

/** Columnas reales del schema Prisma (el orden respeta las claves foráneas). */
const TABLES = [
  {
    model: "user",
    table: "User",
    columns: ["id", "name", "apellido", "interno", "cargo", "email", "password", "image", "phone", "role", "activo", "lastLogin", "createdAt", "updatedAt"],
  },
  { model: "categoria", table: "Categoria", columns: ["id", "nombre", "color", "activo", "createdAt"] },
  { model: "stockCategoria", table: "StockCategoria", columns: ["id", "nombre", "color", "icono", "activo", "createdAt"] },
  { model: "stockItem", table: "StockItem", columns: ["id", "nombre", "cantidad", "createdAt", "updatedAt", "categoriaId"] },
  {
    model: "ticket",
    table: "Ticket",
    columns: ["id", "titulo", "descripcion", "status", "prioridad", "ubicacion", "ipPc", "solucion", "createdAt", "updatedAt", "clienteId", "agenteId", "categoriaId"],
  },
  { model: "comment", table: "Comment", columns: ["id", "contenido", "internal", "createdAt", "ticketId", "autorId"] },
  { model: "attachment", table: "Attachment", columns: ["id", "nombre", "url", "createdAt", "ticketId", "subidoPorId"] },
  {
    model: "instructivo",
    table: "Instructivo",
    columns: ["id", "title", "description", "url", "imageUrl", "contenido", "activo", "createdAt", "updatedAt"],
  },
  {
    model: "interno",
    table: "Interno",
    columns: ["id", "asesor", "turno", "campania", "supervision", "interno", "rol", "activo", "createdAt", "updatedAt"],
  },
  { model: "link", table: "Link", columns: ["id", "title", "description", "url", "imageUrl", "activo", "createdAt", "updatedAt"] },
  { model: "auditLog", table: "AuditLog", columns: ["id", "accion", "detalle", "ip", "fecha", "usuarioId"] },
] as const

async function generateBackup(userEmail: string) {
  const stats: Record<string, number> = {}
  let sql = `-- Backup de la base de datos helpdesk\n-- Fecha: ${new Date().toISOString()}\n-- Generado por: ${userEmail}\n\n`
  sql += "SET client_encoding = 'UTF8';\n\n"

  for (const entry of TABLES) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await (prisma as any)[entry.model].findMany()
    stats[entry.table] = rows.length
    sql += `-- ${entry.table} (${rows.length})\n`
    sql += generateInsert(entry.table, rows, [...entry.columns]) + "\n\n"
  }

  const filename = `backup-helpdesk-${new Date().toISOString().split("T")[0]}.sql`
  return { sql, stats, filename }
}

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user || !ROLES_ADMIN.includes(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { sql, filename } = await generateBackup(session.user.email!)
  await logAudit(session.user.id!, "DESCARGAR_BACKUP", "Backup completo de la base")

  return new NextResponse(sql, {
    status: 200,
    headers: {
      "Content-Type": "application/sql; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}

export async function POST(_req: NextRequest) {
  const session = await auth()
  if (!session?.user || !ROLES_ADMIN.includes(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  // El destinatario es configuración del servidor, nunca un valor fijo en el código.
  const destino = process.env.BACKUP_EMAIL?.trim()
  if (!destino) {
    return NextResponse.json(
      { error: "Configurá BACKUP_EMAIL para enviar el backup por correo" },
      { status: 400 }
    )
  }

  try {
    const { sql, stats, filename } = await generateBackup(session.user.email!)

    const transporter = (await import("nodemailer")).default.createTransport({
      host: process.env.SMTP_HOST || "",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
      },
    })

    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@helpdesk.com",
      to: destino,
      subject: `[Backup Helpdesk] ${new Date().toLocaleDateString("es-AR")} - ${stats.User} usuarios, ${stats.Ticket} tickets`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a56db;">Backup de Base de Datos</h2>
          <p>Se generó un backup del sistema de tickets.</p>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-AR")}</p>
            <p><strong>Usuarios:</strong> ${stats.User}</p>
            <p><strong>Tickets:</strong> ${stats.Ticket}</p>
            <p><strong>Comentarios:</strong> ${stats.Comment}</p>
            <p><strong>Instructivos:</strong> ${stats.Instructivo}</p>
            <p><strong>Internos:</strong> ${stats.Interno}</p>
            <p><strong>Links:</strong> ${stats.Link}</p>
          </div>
          <p style="font-size: 12px; color: #9ca3af;">El archivo SQL adjunto contiene los INSERTs para restaurar la base completa.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 12px; color: #9ca3af;">Sistema de Tickets - Backup Automático</p>
        </div>
      `,
      attachments: [{ filename, content: sql, contentType: "application/sql" }],
    })

    await logAudit(session.user.id!, "ENVIAR_BACKUP", `Backup enviado a ${destino}`)

    return NextResponse.json({ ok: true, filename, stats, destino })
  } catch (error) {
    console.error("Backup email error:", error)
    return NextResponse.json({ error: "Error enviando backup por correo" }, { status: 500 })
  }
}
