"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft,
  Download,
  Fingerprint,
  History,
  Loader2,
  Monitor,
  PlugZap,
  Power,
  Server,
  Terminal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SshTerminal } from "@/components/servers/ssh-terminal"
import { RdpViewer } from "@/components/servers/rdp-viewer"

interface SesionItem {
  id: string
  protocolo: string
  estado: string
  detalle: string | null
  ip: string | null
  inicio: string
  fin: string | null
  duracion: number | null
  usuario: { id: string; name: string; apellido: string | null; email: string }
}

interface ServerDetail {
  id: string
  nombre: string
  host: string
  protocolo: "SSH" | "RDP"
  puerto: number
  usuario: string
  dominio: string | null
  resolucion: string | null
  seguridad: string | null
  descripcion: string | null
  grupo: string | null
  activo: boolean
  fingerprint: string | null
  ultimoEstado: string | null
  ultimoError: string | null
  ultimaConexion: string | null
  tienePassword: boolean
  tieneClavePrivada: boolean
  sesiones: SesionItem[]
}

type SesionActiva =
  | { tipo: "ssh"; sessionId: string }
  | {
      tipo: "rdp"
      sessionId: string
      connectionId: string
      tunnelUrl: string
      width: number
      height: number
    }

export default function ServidorDetallePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const serverId = params.id

  const [data, setData] = useState<ServerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [conectando, setConectando] = useState(false)
  const [probando, setProbando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sesion, setSesion] = useState<SesionActiva | null>(null)
  const [descarga, setDescarga] = useState<string | null>(null)
  const sesionRef = useRef<SesionActiva | null>(null)

  useEffect(() => {
    sesionRef.current = sesion
  }, [sesion])

  const cargar = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/servers/${serverId}`, { cache: "no-store" })
      if (response.status === 404) {
        router.replace("/admin/servidores")
        return
      }
      if (response.ok) setData(await response.json())
    } catch {
      setError("No se pudo cargar el servidor")
    } finally {
      setLoading(false)
    }
  }, [serverId, router])

  useEffect(() => {
    const timer = setTimeout(() => {
      void cargar()
    }, 0)
    return () => clearTimeout(timer)
  }, [cargar])

  // Al salir de la página se cierra cualquier sesión que siga abierta.
  useEffect(() => {
    return () => {
      const actual = sesionRef.current
      if (!actual) return
      const query =
        actual.tipo === "ssh"
          ? `sessionId=${encodeURIComponent(actual.sessionId)}`
          : `sessionId=${encodeURIComponent(actual.sessionId)}&connectionId=${encodeURIComponent(actual.connectionId)}`
      void fetch(`/api/admin/servers/${serverId}/connect?${query}`, { method: "DELETE", keepalive: true })
    }
  }, [serverId])

  async function conectar() {
    if (!data) return
    setConectando(true)
    setError(null)
    setDescarga(null)
    try {
      const response = await fetch(`/api/admin/servers/${serverId}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cols: 120, rows: 32, width: 1280, height: 800 }),
      })
      const payload = await response.json().catch(() => ({}))

      if (payload?.modo === "archivo") {
        setDescarga(payload.downloadUrl ?? `/api/admin/servers/${serverId}/rdp`)
        if (!response.ok && payload.error) setError(payload.error)
        return
      }

      if (!response.ok) {
        setError(payload.error || "No se pudo iniciar la sesión")
        return
      }

      if (payload.protocolo === "SSH") {
        setSesion({ tipo: "ssh", sessionId: payload.sessionId })
      } else {
        setSesion({
          tipo: "rdp",
          sessionId: payload.sessionId,
          connectionId: payload.connectionId,
          tunnelUrl: payload.tunnelUrl,
          width: payload.width ?? 1280,
          height: payload.height ?? 800,
        })
      }
      await cargar()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado")
    } finally {
      setConectando(false)
    }
  }

  async function desconectar() {
    const actual = sesionRef.current
    setSesion(null)
    if (!actual) return
    const query =
      actual.tipo === "ssh"
        ? `sessionId=${encodeURIComponent(actual.sessionId)}`
        : `sessionId=${encodeURIComponent(actual.sessionId)}&connectionId=${encodeURIComponent(actual.connectionId)}`
    await fetch(`/api/admin/servers/${serverId}/connect?${query}`, { method: "DELETE" }).catch(() => {})
    await cargar()
  }

  async function probar() {
    setProbando(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/servers/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: serverId }),
      })
      const payload = await response.json()
      if (!payload.ok) {
        setError(payload.error || "No se pudo conectar")
        toast.error(payload.error || "No se pudo conectar")
      } else {
        toast.success(payload.detalle || "Conexión correcta")
      }
      await cargar()
    } finally {
      setProbando(false)
    }
  }

  const cerrarPorFallo = useCallback(() => {
    void cargar()
  }, [cargar])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="h-64 animate-pulse rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <p className="text-sm text-[var(--text-muted)]">Servidor no encontrado.</p>
        <Link href="/admin/servidores" className="text-sm text-brand-600 hover:underline">
          Volver al listado
        </Link>
      </div>
    )
  }

  const esSsh = data.protocolo === "SSH"

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-6">
      <Link
        href="/admin/servidores"
        className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Servidores
      </Link>

      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-lg ${
                esSsh ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              }`}
            >
              {esSsh ? <Terminal className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
            </span>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)]">{data.nombre}</h1>
              <p className="font-mono text-sm text-[var(--text-muted)]">
                {data.protocolo} · {data.usuario}@{data.host}:{data.puerto}
              </p>
              {data.descripcion && <p className="mt-1 text-sm text-[var(--text-secondary)]">{data.descripcion}</p>}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {sesion ? (
              <Button variant="destructive" onClick={desconectar}>
                <Power className="h-4 w-4" />
                Desconectar
              </Button>
            ) : (
              <Button onClick={conectar} disabled={conectando || !data.activo}>
                {conectando ? <Loader2 className="h-4 w-4 animate-spin" /> : esSsh ? <Terminal className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                Conectar
              </Button>
            )}
            <Button variant="outline" onClick={probar} disabled={probando}>
              {probando ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}
              Probar
            </Button>
            {!esSsh && (
              <a href={`/api/admin/servers/${data.id}/rdp`} download>
                <Button variant="outline">
                  <Download className="h-4 w-4" />
                  Archivo .rdp
                </Button>
              </a>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-2 border-t border-[var(--border-color)] pt-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-[var(--text-muted)]">Estado</p>
            <p className="font-medium text-[var(--text-primary)]">
              {data.activo ? "Habilitado" : "Deshabilitado"} · {data.ultimoEstado || "sin probar"}
            </p>
          </div>
          <div>
            <p className="text-[var(--text-muted)]">Última conexión</p>
            <p className="font-medium text-[var(--text-primary)]">
              {data.ultimaConexion
                ? new Date(data.ultimaConexion).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })
                : "Nunca"}
            </p>
          </div>
          <div>
            <p className="text-[var(--text-muted)]">Grupo</p>
            <p className="font-medium text-[var(--text-primary)]">{data.grupo || "—"}</p>
          </div>
          <div>
            <p className="text-[var(--text-muted)]">Credencial</p>
            <p className="font-medium text-[var(--text-primary)]">
              {data.tieneClavePrivada ? "Clave SSH" : data.tienePassword ? "Contraseña" : "Sin guardar"}
            </p>
          </div>
        </div>

        <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-[var(--bg-tertiary)] px-3 py-2 text-[11px] text-[var(--text-secondary)]">
          <Fingerprint className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="break-all">
            {data.fingerprint
              ? `Huella del servidor verificada (TOFU): ${data.fingerprint}`
              : esSsh
                ? "Sin huella registrada: se guardará automáticamente en la primera conexión SSH."
                : "La huella del servidor se verifica al abrir la sesión RDP."}
          </span>
        </p>

        {data.ultimoError && (
          <p className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
            Último error: {data.ultimoError}
          </p>
        )}
        {error && (
          <p className="mt-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">{error}</p>
        )}
      </div>

      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
        {sesion?.tipo === "ssh" ? (
          <SshTerminal sessionId={sesion.sessionId} onClose={cerrarPorFallo} />
        ) : sesion?.tipo === "rdp" ? (
          <RdpViewer
            tunnelUrl={sesion.tunnelUrl}
            width={sesion.width}
            height={sesion.height}
            onClose={cerrarPorFallo}
          />
        ) : descarga ? (
          <div className="space-y-3 py-8 text-center">
            <Monitor className="mx-auto h-8 w-8 text-[var(--text-muted)]" />
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Guacamole no está configurado en este entorno
            </p>
            <p className="mx-auto max-w-md text-xs text-[var(--text-muted)]">
              Descargá el archivo <code className="font-mono">.rdp</code> y abrilo con el cliente de escritorio remoto
              de Windows. La contraseña se solicita al conectar.
            </p>
            <a href={descarga} download>
              <Button>
                <Download className="h-4 w-4" />
                Descargar .rdp
              </Button>
            </a>
          </div>
        ) : (
          <div className="space-y-2 py-12 text-center">
            <Server className="mx-auto h-9 w-9 text-[var(--text-muted)]" />
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {esSsh ? "Terminal SSH" : "Escritorio remoto"}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Presioná «Conectar» para abrir una sesión con las credenciales guardadas.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-2 border-b border-[var(--border-color)] px-4 py-3">
          <History className="h-4 w-4 text-[var(--text-muted)]" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Historial de accesos</h2>
        </div>
        {data.sesiones.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">Todavía no hay accesos registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border-color)] text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-2 font-medium">Usuario</th>
                  <th className="px-4 py-2 font-medium">Inicio</th>
                  <th className="px-4 py-2 font-medium">Duración</th>
                  <th className="px-4 py-2 font-medium">Estado</th>
                  <th className="px-4 py-2 font-medium">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {data.sesiones.map(item => (
                  <tr key={item.id} className="border-b border-[var(--border-color)] last:border-0">
                    <td className="px-4 py-2 text-[var(--text-primary)]">
                      {[item.usuario.name, item.usuario.apellido].filter(Boolean).join(" ") || item.usuario.email}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-[var(--text-secondary)]">
                      {new Date(item.inicio).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="px-4 py-2 text-[var(--text-secondary)]">
                      {item.duracion !== null ? `${Math.floor(item.duracion / 60)}m ${item.duracion % 60}s` : "—"}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          item.estado === "ACTIVA"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : item.estado === "ERROR"
                              ? "bg-red-500/10 text-red-600 dark:text-red-400"
                              : "bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
                        }`}
                      >
                        {item.estado}
                      </span>
                    </td>
                    <td className="max-w-xs truncate px-4 py-2 text-xs text-[var(--text-muted)]" title={item.detalle ?? ""}>
                      {item.detalle || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
