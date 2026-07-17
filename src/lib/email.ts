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

export function ticketCerradoEmail({ titulo, nombre, solucion, url }: { titulo: string; nombre: string; solucion: string; url: string }) {
  return {
    subject: `[Ticket Cerrado] ${titulo}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a56db;">Ticket cerrado</h2>
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>El ticket <strong>${titulo}</strong> ha sido cerrado.</p>
        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0; font-weight: 600; color: #166534;">Solución:</p>
          <p style="margin: 0; color: #374151; white-space: pre-wrap;">${solucion}</p>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 6px;">Ver ticket</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 12px; color: #9ca3af;">Sistema de Tickets</p>
      </div>
    `,
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

export function nuevaCuentaEmail({ nombre, email, password, url }: { nombre: string; email: string; password: string; url: string }) {
  return {
    subject: "Tu cuenta ha sido creada - Helpdesk",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a56db;">Cuenta creada</h2>
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>Se ha creado una cuenta para vos en el sistema de tickets.</p>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 4px 0;"><strong>Contraseña:</strong> ${password}</p>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #1a56db; color: white; text-decoration: none; border-radius: 6px;">Iniciar sesión</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 12px; color: #9ca3af;">Sistema de Tickets</p>
      </div>
    `,
  }
}

export function passwordCambiadaEmail({ nombre, email, password, url }: { nombre: string; email: string; password: string; url: string }) {
  return {
    subject: "Tu contraseña ha sido cambiada - Helpdesk",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a56db;">Contraseña actualizada</h2>
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>Tu contraseña en el sistema de tickets ha sido actualizada por un administrador.</p>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 4px 0;"><strong>Nueva contraseña:</strong> ${password}</p>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #1a56db; color: white; text-decoration: none; border-radius: 6px;">Iniciar sesión</a>
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

export function hostDownEmail({ nombre, ip, detalle, grupo, fecha, url }: { nombre: string; ip: string; detalle: string | null; grupo: string | null; fecha: string; url: string }) {
  return {
    subject: `[ALERTA] ${nombre} (${ip}) - OFFLINE`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h2 style="color: #dc2626; margin: 0 0 8px 0;">Host caído</h2>
          <p style="margin: 0; color: #7f1d1d; font-weight: 600;">${nombre} no responde</p>
        </div>
        <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Hostname:</strong> ${nombre}</p>
          <p style="margin: 4px 0;"><strong>IP:</strong> ${ip}</p>
          ${grupo ? `<p style="margin: 4px 0;"><strong>Grupo:</strong> ${grupo}</p>` : ""}
          ${detalle ? `<p style="margin: 4px 0;"><strong>Detalle:</strong> ${detalle}</p>` : ""}
          <p style="margin: 4px 0;"><strong>Fecha:</strong> ${fecha}</p>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px;">Ver monitor</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 12px; color: #9ca3af;">Sistema de Monitoreo - Helpdesk</p>
      </div>
    `,
  }
}

export function hostRecoveredEmail({ nombre, ip, detalle, grupo, fecha, url }: { nombre: string; ip: string; detalle: string | null; grupo: string | null; fecha: string; url: string }) {
  return {
    subject: `[RECUPERADO] ${nombre} (${ip}) - ONLINE`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h2 style="color: #166534; margin: 0 0 8px 0;">Host recuperado</h2>
          <p style="margin: 0; color: #14532d; font-weight: 600;">${nombre} volvió a estar online</p>
        </div>
        <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Hostname:</strong> ${nombre}</p>
          <p style="margin: 4px 0;"><strong>IP:</strong> ${ip}</p>
          ${grupo ? `<p style="margin: 4px 0;"><strong>Grupo:</strong> ${grupo}</p>` : ""}
          ${detalle ? `<p style="margin: 4px 0;"><strong>Detalle:</strong> ${detalle}</p>` : ""}
          <p style="margin: 4px 0;"><strong>Fecha:</strong> ${fecha}</p>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 6px;">Ver monitor</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 12px; color: #9ca3af;">Sistema de Monitoreo - Helpdesk</p>
      </div>
    `,
  }
}
