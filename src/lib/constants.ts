export const ROLES = {
  ADMIN: "ADMIN" as const,
  AGENT: "AGENT" as const,
  CLIENT: "CLIENT" as const,
}

export const ROLES_ADMIN_AGENT: string[] = [ROLES.ADMIN, ROLES.AGENT]

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  NUEVO: ["EN_CURSO", "EN_ESPERA"],
  EN_CURSO: ["EN_ESPERA", "CERRADO"],
  EN_ESPERA: ["EN_CURSO", "CERRADO"],
  CERRADO: ["EN_CURSO"],
}

export const STATUS_LABELS: Record<string, string> = {
  NUEVO: "Nuevo",
  EN_CURSO: "En Curso",
  EN_ESPERA: "En Espera",
  CERRADO: "Cerrado",
}

export const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "outline"> = {
  NUEVO: "default",
  EN_CURSO: "warning",
  EN_ESPERA: "secondary",
  CERRADO: "outline",
}

export const PRIORIDAD_COLORS: Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "outline"> = {
  BAJA: "secondary",
  MEDIA: "default",
  ALTA: "warning",
  CRITICA: "destructive",
}
