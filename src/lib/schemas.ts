import { z } from "zod"

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
  password: z.string().min(6, "Mínimo 6 caracteres"),
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
