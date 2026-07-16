import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ROLES_ADMIN } from "@/lib/constants"

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

async function generateBackup(userEmail: string) {
  const [users, tickets, comments, attachments, instructivos, internos, categorias, stockCategorias, stockItems, links, auditLogs] = await Promise.all([
    prisma.user.findMany(),
    prisma.ticket.findMany(),
    prisma.comment.findMany(),
    prisma.attachment.findMany(),
    prisma.instructivo.findMany(),
    prisma.interno.findMany(),
    prisma.categoria.findMany(),
    prisma.stockCategoria.findMany(),
    prisma.stockItem.findMany(),
    prisma.link.findMany(),
    prisma.auditLog.findMany(),
  ])

  const userCols = ["id", "name", "email", "password", "role", "interno", "cargo", "createdAt", "updatedAt"]
  const ticketCols = ["id", "subject", "description", "status", "prioridad", "createdAt", "updatedAt", "createdById", "assignedToId", "categoriaId", "solucion"]
  const commentCols = ["id", "content", "createdAt", "authorId", "ticketId"]
  const attachmentCols = ["id", "filename", "url", "mimeType", "size", "createdAt", "ticketId", "commentId"]
  const instructivoCols = ["id", "title", "description", "url", "imageUrl", "contenido", "activo", "createdAt", "updatedAt"]
  const internoCols = ["id", "nombre", "apellido", "email", "area", "cargo", "activo", "createdAt", "updatedAt"]
  const categoriaCols = ["id", "nombre", "color", "createdAt", "updatedAt"]
  const stockCategoriaCols = ["id", "nombre", "color"]
  const stockItemCols = ["id", "nombre", "descripcion", "cantidad", "ubicacion", "categoriaId", "createdAt", "updatedAt"]
  const linkCols = ["id", "title", "description", "url", "imageUrl", "activo", "createdAt", "updatedAt"]
  const auditLogCols = ["id", "action", "entity", "entityId", "userId", "changes", "createdAt"]

  const fecha = new Date().toISOString()
  let sql = `-- Backup de la base de datos ticket\n-- Fecha: ${fecha}\n-- Generado por: ${userEmail}\n\n`
  sql += "SET client_encoding = 'UTF8';\n\n"
  sql += `-- Usuarios (${users.length})\n` + generateInsert("User", users, userCols) + "\n\n"
  sql += `-- Categorías (${categorias.length})\n` + generateInsert("Categoria", categorias, categoriaCols) + "\n\n"
  sql += `-- Categorías de Stock (${stockCategorias.length})\n` + generateInsert("StockCategoria", stockCategorias, stockCategoriaCols) + "\n\n"
  sql += `-- Tickets (${tickets.length})\n` + generateInsert("Ticket", tickets, ticketCols) + "\n\n"
  sql += `-- Comentarios (${comments.length})\n` + generateInsert("Comment", comments, commentCols) + "\n\n"
  sql += `-- Adjuntos (${attachments.length})\n` + generateInsert("Attachment", attachments, attachmentCols) + "\n\n"
  sql += `-- Instructivos (${instructivos.length})\n` + generateInsert("Instructivo", instructivos, instructivoCols) + "\n\n"
  sql += `-- Internos (${internos.length})\n` + generateInsert("Interno", internos, internoCols) + "\n\n"
  sql += `-- Items de Stock (${stockItems.length})\n` + generateInsert("StockItem", stockItems, stockItemCols) + "\n\n"
  sql += `-- Links (${links.length})\n` + generateInsert("Link", links, linkCols) + "\n\n"
  sql += `-- Audit Logs (${auditLogs.length})\n` + generateInsert("AuditLog", auditLogs, auditLogCols) + "\n"

  const stats = { users: users.length, tickets: tickets.length, comments: comments.length, instructivos: instructivos.length, internos: internos.length, links: links.length }
  const filename = `backup-helpdesk-${new Date().toISOString().split("T")[0]}.sql`

  return { sql, stats, filename, fecha }
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !ROLES_ADMIN.includes(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { sql, filename } = await generateBackup(session.user.email!)

  return new NextResponse(sql, {
    status: 200,
    headers: {
      "Content-Type": "application/sql; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !ROLES_ADMIN.includes(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const { sql, stats, filename, fecha } = await generateBackup(session.user.email!)

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
      to: "cpereyra@face.unt.edu.ar",
      subject: `[Backup Helpdesk] ${new Date().toLocaleDateString("es-AR")} - ${stats.users} usuarios, ${stats.tickets} tickets, ${stats.instructivos} instructivos`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a56db;">Backup de Base de Datos</h2>
          <p>Se generó un backup del sistema de tickets.</p>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-AR")}</p>
            <p><strong>Usuarios:</strong> ${stats.users}</p>
            <p><strong>Tickets:</strong> ${stats.tickets}</p>
            <p><strong>Comentarios:</strong> ${stats.comments}</p>
            <p><strong>Instructivos:</strong> ${stats.instructivos}</p>
            <p><strong>Internos:</strong> ${stats.internos}</p>
            <p><strong>Links:</strong> ${stats.links}</p>
          </div>
          <p style="font-size: 12px; color: #9ca3af;">El archivo SQL adjunto contiene los INSERTs para restaurar la base completa.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 12px; color: #9ca3af;">Sistema de Tickets - Backup Automático</p>
        </div>
      `,
      attachments: [{ filename, content: sql, contentType: "application/sql" }],
    })

    return NextResponse.json({ ok: true, filename, stats })
  } catch (error) {
    console.error("Backup email error:", error)
    return NextResponse.json({ error: "Error enviando backup por correo" }, { status: 500 })
  }
}
