import { z } from "zod"
import { isIpLiteral } from "./ip"

/** Contraseña mínima aceptada en todo el sistema (bcrypt corta a 72 bytes). */
export const passwordSchema = z
  .string()
  .min(10, "Mínimo 10 caracteres")
  .refine(value => Buffer.byteLength(value, "utf8") <= 72, "Máximo 72 bytes")

/** URL absoluta http/https: evita `javascript:`, `data:` y rutas relativas. */
export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

export const httpUrlSchema = z
  .string()
  .trim()
  .min(1, "URL requerida")
  .max(2048)
  .refine(isSafeHttpUrl, "Solo se permiten enlaces http(s)")

export const optionalHttpUrlSchema = z
  .union([z.string().trim().max(2048), z.null()])
  .optional()
  .refine(
    value => value === undefined || value === null || value === "" || isSafeHttpUrl(value),
    "Solo se permiten enlaces http(s)"
  )

export const crearTicketSchema = z.object({
  titulo: z.string().min(1, "Título requerido"),
  descripcion: z.string().min(1, "Descripción requerida"),
  prioridad: z.enum(["BAJA", "MEDIA", "ALTA", "CRITICA"]).optional(),
  categoriaId: z.string().nullable().optional(),
  ubicacion: z.string().nullable().optional(),
  ipPc: z.string().nullable().optional(),
  archivos: z.array(z.object({ nombre: z.string(), url: z.string() })).optional(),
})

export const actualizarTicketSchema = z.object({
  titulo: z.string().optional(),
  descripcion: z.string().optional(),
  status: z.enum(["NUEVO", "EN_CURSO", "EN_ESPERA", "CERRADO"]).optional(),
  prioridad: z.enum(["BAJA", "MEDIA", "ALTA", "CRITICA"]).optional(),
  agenteId: z.string().nullable().optional(),
  categoriaId: z.string().nullable().optional(),
  ubicacion: z.string().nullable().optional(),
  ipPc: z.string().nullable().optional(),
  solucion: z.string().nullable().optional(),
})

export const crearCategoriaSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  color: z.string().optional(),
})

export const crearUsuarioSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  email: z.string().email("Email inválido"),
  password: passwordSchema,
  role: z.enum(["ADMIN", "AGENT", "CLIENT"]).optional(),
})

export const crearStockItemSchema = z.object({
  categoriaId: z.string().min(1, "Categoría requerida"),
  nombre: z.string().min(1, "Nombre requerido"),
  cantidad: z.number().int().optional(),
})

export const crearStockCategoriaSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  color: z.string().optional(),
  icono: z.string().optional(),
})

export const crearMonitorGroupSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  color: z.string().optional(),
})

export const crearMonitorHostSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  ip: z.string().refine(isIpLiteral, "IP inválida (IPv4 o IPv6)"),
  detalle: z.string().optional(),
  grupoId: z.string().nullable().optional(),
  notificarAdmin: z.boolean().optional(),
})

export const crearEquipoSchema = z.object({
  tipoId: z.string().min(1, "Tipo requerido"),
  estadoId: z.string().min(1, "Estado requerido"),
  nroInventario: z.string().min(1, "N° inventario requerido"),
  marca: z.string().min(1, "Marca requerida"),
  modelo: z.string().min(1, "Modelo requerido"),
  serie: z.string().optional().nullable(),
  ubicacion: z.string().optional().nullable(),
  ipPc: z.string().optional().nullable(),
})

export const crearTipoEquipoSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  color: z.string().optional(),
})

export const crearEstadoEquipoSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  color: z.string().optional(),
})

export const crearCategoriaWikiSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  color: z.string().optional(),
  icono: z.string().optional(),
  orden: z.number().int().optional(),
})

export const crearArticuloWikiSchema = z.object({
  categoriaId: z.string().min(1, "Categoría requerida"),
  titulo: z.string().min(1, "Título requerido"),
  resumen: z.string().optional().nullable(),
  contenido: z.string().optional().nullable(),
})

// ---------------------------------------------------------------------------
// Contenido administrable: Links, Instructivos e Internos
// ---------------------------------------------------------------------------

export const crearLinkSchema = z.object({
  title: z.string().trim().min(1, "Título requerido").max(200),
  description: z.string().max(1000).default(""),
  url: httpUrlSchema,
  imageUrl: optionalHttpUrlSchema,
  activo: z.boolean().optional(),
})

export const actualizarLinkSchema = crearLinkSchema.partial()

export const crearInstructivoSchema = z.object({
  title: z.string().trim().min(1, "Título requerido").max(200),
  description: z.string().max(1000).optional(),
  url: httpUrlSchema,
  imageUrl: optionalHttpUrlSchema,
  contenido: z.string().nullable().optional(),
  activo: z.boolean().optional(),
})

export const actualizarInstructivoSchema = crearInstructivoSchema.partial()

export const crearInternoSchema = z.object({
  asesor: z.string().trim().min(1, "Asesor requerido").max(200),
  turno: z.string().trim().min(1, "Turno requerido").max(100),
  campania: z.string().trim().min(1, "Campaña requerida").max(200),
  supervision: z.string().trim().min(1, "Supervisión requerida").max(200),
  interno: z.string().trim().min(1, "Interno requerido").max(50),
  rol: z.string().trim().min(1, "Rol requerido").max(100),
  activo: z.boolean().optional(),
})

export const actualizarInternoSchema = crearInternoSchema.partial()
