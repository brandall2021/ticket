import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
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

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !ROLES_ADMIN.includes(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
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

    let sql = `-- Backup de la base de datos ticket\n-- Fecha: ${new Date().toISOString()}\n-- Generado por: ${session.user.email}\n\n`
    sql += "SET client_encoding = 'UTF8';\n\n"

    sql += `-- Usuarios (${users.length})\n`
    sql += generateInsert("User", users, userCols) + "\n\n"
    sql += `-- Categorías (${categorias.length})\n`
    sql += generateInsert("Categoria", categorias, categoriaCols) + "\n\n"
    sql += `-- Categorías de Stock (${stockCategorias.length})\n`
    sql += generateInsert("StockCategoria", stockCategorias, stockCategoriaCols) + "\n\n"
    sql += `-- Tickets (${tickets.length})\n`
    sql += generateInsert("Ticket", tickets, ticketCols) + "\n\n"
    sql += `-- Comentarios (${comments.length})\n`
    sql += generateInsert("Comment", comments, commentCols) + "\n\n"
    sql += `-- Adjuntos (${attachments.length})\n`
    sql += generateInsert("Attachment", attachments, attachmentCols) + "\n\n"
    sql += `-- Instructivos (${instructivos.length})\n`
    sql += generateInsert("Instructivo", instructivos, instructivoCols) + "\n\n"
    sql += `-- Internos (${internos.length})\n`
    sql += generateInsert("Interno", internos, internoCols) + "\n\n"
    sql += `-- Items de Stock (${stockItems.length})\n`
    sql += generateInsert("StockItem", stockItems, stockItemCols) + "\n\n"
    sql += `-- Links (${links.length})\n`
    sql += generateInsert("Link", links, linkCols) + "\n\n"
    sql += `-- Audit Logs (${auditLogs.length})\n`
    sql += generateInsert("AuditLog", auditLogs, auditLogCols) + "\n"

    const fecha = new Date().toISOString().split("T")[0]
    const filename = `backup-helpdesk-${fecha}.sql`

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
      subject: `[Backup Helpdesk] ${fecha} - ${users.length} usuarios, ${tickets.length} tickets, ${instructivos.length} instructivos`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a56db;">Backup de Base de Datos</h2>
          <p>Se generó un backup del sistema de tickets.</p>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-AR")}</p>
            <p><strong>Usuarios:</strong> ${users.length}</p>
            <p><strong>Tickets:</strong> ${tickets.length}</p>
            <p><strong>Comentarios:</strong> ${comments.length}</p>
            <p><strong>Instructivos:</strong> ${instructivos.length}</p>
            <p><strong>Internos:</strong> ${internos.length}</p>
            <p><strong>Links:</strong> ${links.length}</p>
            <p><strong>Categorías:</strong> ${categorias.length}</p>
          </div>
          <p style="font-size: 12px; color: #9ca3af;">El archivo SQL adjunto contiene los INSERTs para restaurar la base completa.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 12px; color: #9ca3af;">Sistema de Tickets - Backup Automático</p>
        </div>
      `,
      attachments: [{ filename, content: sql, contentType: "application/sql" }],
    })

    return NextResponse.json({ ok: true, filename, stats: { users: users.length, tickets: tickets.length, comments: comments.length, instructivos: instructivos.length, internos: internos.length, links: links.length } })
  } catch (error) {
    console.error("Backup error:", error)
    return NextResponse.json({ error: "Error generando backup" }, { status: 500 })
  }
}
