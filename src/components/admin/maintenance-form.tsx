"use client"

import { useState } from "react"
import { Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"

export interface MaintenanceData {
  id?: string
  titulo: string
  descripcion: string
  scheduledAt: string
  duration: number
  status: string
  hostIds: string
}

interface MaintenanceFormProps {
  initial?: MaintenanceData
  onSave: (data: MaintenanceData) => Promise<void>
  onCancel: () => void
}

function toDatetimeLocal(dateStr: string) {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function MaintenanceForm({ initial, onSave, onCancel }: MaintenanceFormProps) {
  const [titulo, setTitulo] = useState(initial?.titulo || "")
  const [descripcion, setDescripcion] = useState(initial?.descripcion || "")
  const [scheduledAt, setScheduledAt] = useState(
    initial?.scheduledAt ? toDatetimeLocal(initial.scheduledAt) : ""
  )
  const [duration, setDuration] = useState(String(initial?.duration ?? 60))
  const [status, setStatus] = useState(initial?.status || "PROGRAMADO")
  const [hostIds, setHostIds] = useState(initial?.hostIds || "")
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({
      id: initial?.id,
      titulo,
      descripcion,
      scheduledAt,
      duration: parseInt(duration) || 60,
      status,
      hostIds,
    })
    setSaving(false)
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Título</Label>
              <Input
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Actualización de servidor..."
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Hosts afectados</Label>
              <Input
                value={hostIds}
                onChange={e => setHostIds(e.target.value)}
                placeholder="host-1, host-2"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Fecha y hora programada</Label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Duración (minutos)</Label>
              <Input
                type="number"
                min="1"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Estado</Label>
              <Select value={status} onChange={e => setStatus(e.target.value)}>
                <option value="PROGRAMADO">Programado</option>
                <option value="EN_CURSO">En curso</option>
                <option value="FINALIZADO">Finalizado</option>
              </Select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Descripción</Label>
              <Textarea
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Detalles del mantenimiento..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Guardando..." : "Guardar"}
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel} className="gap-2">
              <X className="h-4 w-4" />
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
