export const ROLES = {
  ADMIN: "ADMIN" as const,
  AGENT: "AGENT" as const,
  CLIENT: "CLIENT" as const,
}

export const ROLES_ADMIN_AGENT: string[] = [ROLES.ADMIN, ROLES.AGENT]

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  NUEVO: ["ASIGNADO"],
  ASIGNADO: ["EN_PROGRESO"],
  EN_PROGRESO: ["RESUELTO"],
  RESUELTO: ["CERRADO"],
  CERRADO: ["REABIERTO"],
  REABIERTO: ["ASIGNADO"],
}

export const STATUS_LABELS: Record<string, string> = {
  NUEVO: "Nuevo",
  ASIGNADO: "Asignado",
  EN_PROGRESO: "En Progreso",
  RESUELTO: "Resuelto",
  CERRADO: "Cerrado",
  REABIERTO: "Reabierto",
}

export const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "outline"> = {
  NUEVO: "default",
  ASIGNADO: "secondary",
  EN_PROGRESO: "warning",
  RESUELTO: "success",
  CERRADO: "outline",
  REABIERTO: "destructive",
}

export const PRIORIDAD_COLORS: Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "outline"> = {
  BAJA: "secondary",
  MEDIA: "default",
  ALTA: "warning",
  CRITICA: "destructive",
}
