"use client"

import { useState } from "react"
import { CheckCircle2, Loader2, PlugZap, Save, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export type ServerProtocolInput = "SSH" | "RDP"

export interface ServerFormValues {
  nombre: string
  host: string
  protocolo: ServerProtocolInput
  puerto: number
  usuario: string
  password: string
  privateKey: string
  passphrase: string
  dominio: string
  resolucion: string
  seguridad: string
  descripcion: string
  grupo: string
  activo: boolean
}

export const EMPTY_SERVER_FORM: ServerFormValues = {
  nombre: "",
  host: "",
  protocolo: "SSH",
  puerto: 22,
  usuario: "root",
  password: "",
  privateKey: "",
  passphrase: "",
  dominio: "",
  resolucion: "1280x800",
  seguridad: "any",
  descripcion: "",
  grupo: "",
  activo: true,
}

const PUERTOS: Record<ServerProtocolInput, number> = { SSH: 22, RDP: 3389 }

interface TestResult {
  ok: boolean
  etapa?: string
  error?: string
  detalle?: string
  latencia?: number
  fingerprint?: string | null
}

interface ServerFormProps {
  initial: ServerFormValues
  mode: "create" | "edit"
  serverId?: string
  tienePassword?: boolean
  tieneClavePrivada?: boolean
  saving?: boolean
  error?: string | null
  onSubmit: (values: ServerFormValues) => void
  onCancel: () => void
}

export function ServerForm({
  initial,
  mode,
  serverId,
  tienePassword,
  tieneClavePrivada,
  saving,
  error,
  onSubmit,
  onCancel,
}: ServerFormProps) {
  const [values, setValues] = useState<ServerFormValues>(initial)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)

  const esSsh = values.protocolo === "SSH"

  function update<K extends keyof ServerFormValues>(key: K, value: ServerFormValues[K]) {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  function changeProtocolo(protocolo: ServerProtocolInput) {
    setValues(prev => ({
      ...prev,
      protocolo,
      // Sólo se cambia el puerto si seguía siendo el valor por defecto anterior.
      puerto: prev.puerto === PUERTOS[prev.protocolo] ? PUERTOS[protocolo] : prev.puerto,
    }))
  }

  async function probar() {
    setTesting(true)
    setResult(null)
    try {
      const response = await fetch("/api/admin/servers/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: serverId,
          host: values.host,
          puerto: values.puerto,
          protocolo: values.protocolo,
          usuario: values.usuario,
          password: values.password || undefined,
          privateKey: values.privateKey || undefined,
          passphrase: values.passphrase || undefined,
        }),
      })
      setResult(await response.json())
    } catch (err) {
      setResult({ ok: false, error: err instanceof Error ? err.message : "Error inesperado" })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5">
      <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
        {mode === "create" ? "Nuevo servidor" : "Editar servidor"}
      </h3>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label className="mb-1 block" htmlFor="nombre">Nombre</Label>
          <Input id="nombre" value={values.nombre} onChange={e => update("nombre", e.target.value)} placeholder="Servidor de archivos" />
        </div>
        <div>
          <Label className="mb-1 block" htmlFor="grupo">Grupo / ubicación</Label>
          <Input id="grupo" value={values.grupo} onChange={e => update("grupo", e.target.value)} placeholder="Sede central" />
        </div>
        <div>
          <Label className="mb-1 block" htmlFor="protocolo">Protocolo</Label>
          <Select
            id="protocolo"
            value={values.protocolo}
            onChange={e => changeProtocolo(e.target.value as ServerProtocolInput)}
          >
            <option value="SSH">SSH (terminal)</option>
            <option value="RDP">RDP (escritorio remoto)</option>
          </Select>
        </div>
        <div>
          <Label className="mb-1 block" htmlFor="host">Host / IP</Label>
          <Input id="host" value={values.host} onChange={e => update("host", e.target.value)} placeholder="192.168.10.20" />
        </div>
        <div>
          <Label className="mb-1 block" htmlFor="puerto">Puerto</Label>
          <Input
            id="puerto"
            type="number"
            value={values.puerto}
            onChange={e => update("puerto", Number.parseInt(e.target.value, 10) || PUERTOS[values.protocolo])}
          />
        </div>
        <div>
          <Label className="mb-1 block" htmlFor="usuario">Usuario</Label>
          <Input id="usuario" value={values.usuario} onChange={e => update("usuario", e.target.value)} />
        </div>
        <div>
          <Label className="mb-1 block" htmlFor="password">
            Contraseña{mode === "edit" && tienePassword ? " (guardada)" : ""}
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={e => update("password", e.target.value)}
            placeholder={mode === "edit" && tienePassword ? "•••••••• (dejar vacío para conservar)" : ""}
          />
        </div>
        {!esSsh && (
          <>
            <div>
              <Label className="mb-1 block" htmlFor="dominio">Dominio</Label>
              <Input id="dominio" value={values.dominio} onChange={e => update("dominio", e.target.value)} placeholder="EMPRESA" />
            </div>
            <div>
              <Label className="mb-1 block" htmlFor="resolucion">Resolución</Label>
              <Input id="resolucion" value={values.resolucion} onChange={e => update("resolucion", e.target.value)} placeholder="1280x800" />
            </div>
            <div>
              <Label className="mb-1 block" htmlFor="seguridad">Seguridad</Label>
              <Select id="seguridad" value={values.seguridad} onChange={e => update("seguridad", e.target.value)}>
                <option value="any">Automática (any)</option>
                <option value="nla">NLA</option>
                <option value="tls">TLS</option>
                <option value="rdp">RDP clásico</option>
              </Select>
            </div>
          </>
        )}
      </div>

      {esSsh && (
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Label className="mb-1 block" htmlFor="privateKey">
              Clave privada (opcional){mode === "edit" && tieneClavePrivada ? " — guardada" : ""}
            </Label>
            <Textarea
              id="privateKey"
              rows={4}
              className="font-mono text-xs"
              value={values.privateKey}
              onChange={e => update("privateKey", e.target.value)}
              placeholder={mode === "edit" && tieneClavePrivada ? "Dejar vacío para conservar la clave guardada" : "-----BEGIN OPENSSH PRIVATE KEY-----"}
            />
          </div>
          <div>
            <Label className="mb-1 block" htmlFor="passphrase">Passphrase de la clave</Label>
            <Input
              id="passphrase"
              type="password"
              autoComplete="new-password"
              value={values.passphrase}
              onChange={e => update("passphrase", e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="mb-1 block" htmlFor="descripcion">Descripción</Label>
          <Input
            id="descripcion"
            value={values.descripcion}
            onChange={e => update("descripcion", e.target.value)}
            placeholder="Para qué se usa y quién lo administra"
          />
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={values.activo}
            onChange={e => update("activo", e.target.checked)}
            className="h-4 w-4 rounded"
          />
          Servidor habilitado
        </label>
      </div>

      {result && (
        <div
          className={`mt-3 flex items-start gap-2 rounded-lg border p-3 text-sm ${
            result.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
          }`}
        >
          {result.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          <div className="space-y-0.5">
            <p className="font-medium">{result.ok ? "Conexión correcta" : result.error || "No se pudo conectar"}</p>
            {result.detalle && <p className="text-xs opacity-90">{result.detalle}</p>}
            {typeof result.latencia === "number" && <p className="text-xs opacity-70">{result.latencia} ms</p>}
            {result.fingerprint && (
              <p className="break-all font-mono text-[10px] opacity-70">Huella: {result.fingerprint}</p>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button onClick={() => onSubmit(values)} disabled={saving || !values.nombre || !values.host || !values.usuario}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {mode === "create" ? "Crear servidor" : "Guardar cambios"}
        </Button>
        <Button variant="outline" onClick={probar} disabled={testing || !values.host}>
          {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}
          Probar conexión
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>
    </div>
  )
}
