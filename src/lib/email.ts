import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
})

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!process.env.SMTP_HOST) return

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@helpdesk.com",
      to,
      subject,
      html,
    })
  } catch (error) {
    console.error("Error sending email:", error)
  }
}

export function ticketNotificationEmail({ titulo, status, url, nombre }: { titulo: string; status: string; url: string; nombre: string }) {
  return {
    subject: `[Ticket] ${titulo} - ${status}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a56db;">Actualización de Ticket</h2>
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>El ticket <strong>${titulo}</strong> cambió a estado <strong>${status}</strong>.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #1a56db; color: white; text-decoration: none; border-radius: 6px;">Ver ticket</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 12px; color: #9ca3af;">Sistema de Tickets</p>
      </div>
    `,
  }
}

export function resetPasswordEmail({ name, url }: { name: string; url: string }) {
  return {
    subject: "Recuperación de contraseña - Helpdesk",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a56db;">Recuperación de contraseña</h2>
        <p>Hola <strong>${name}</strong>,</p>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #1a56db; color: white; text-decoration: none; border-radius: 6px;">Restablecer contraseña</a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Este enlace expira en 1 hora.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 12px; color: #9ca3af;">Sistema de Tickets</p>
      </div>
    `,
  }
}
