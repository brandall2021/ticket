import { z } from "zod"

export const hostSchema = z
  .string()
  .trim()
  .min(1, "Host requerido")
  .max(255)
  .regex(/^[a-zA-Z0-9._:[\]-]+$/, "Host inválido")

const camposBase = {
  nombre: z.string().trim().min(1, "Nombre requerido").max(120),
  host: hostSchema,
  protocolo: z.enum(["SSH", "RDP"]),
  puerto: z.number().int().min(1).max(65535).optional(),
  usuario: z.string().trim().min(1, "Usuario requerido").max(120),
  password: z.string().max(4096).nullable().optional(),
  privateKey: z.string().max(32768).nullable().optional(),
  passphrase: z.string().max(4096).nullable().optional(),
  dominio: z.string().trim().max(120).nullable().optional(),
  resolucion: z.string().trim().max(20).nullable().optional(),
  seguridad: z.enum(["any", "nla", "tls", "rdp"]).nullable().optional(),
  descripcion: z.string().trim().max(500).nullable().optional(),
  grupo: z.string().trim().max(80).nullable().optional(),
  color: z.string().trim().max(20).optional(),
  activo: z.boolean().optional(),
}

export const crearServerSchema = z.object({
  ...camposBase,
  protocolo: z.enum(["SSH", "RDP"]).default("SSH"),
})

/** Sin `default()` para distinguir “no enviado” de “valor por defecto” en un PATCH. */
export const actualizarServerSchema = z.object(camposBase).partial()

export type CrearServerInput = z.infer<typeof crearServerSchema>
export type ActualizarServerInput = z.infer<typeof actualizarServerSchema>

export function emptyToNull(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}
