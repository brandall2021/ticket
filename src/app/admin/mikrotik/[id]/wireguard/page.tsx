"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { Loader2, RefreshCw, WifiOff } from "lucide-react"
import { formatBytes } from "@/lib/format"

interface WGInterface {
  name: string
  running: boolean
  disabled: boolean
  publicKey: string | null
  listenPort: number | null
  mtu: number | null
  comment: string | null
}

interface WGPeer {
  interface: string | null
  publicKey: string | null
  endpointAddress: string | null
  endpointPort: number | null
  lastHandshake: string | null
  allowedAddress: string | null
  rxBytes: number | null
  txBytes: number | null
  running: boolean
  disabled: boolean
  comment: string | null
}

export default function WireguardPage() {
  const params = useParams()
  const id = params?.id as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [ifaces, setIfaces] = useState<WGInterface[]>([])
  const [peers, setPeers] = useState<WGPeer[]>([])

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/mikrotik/${id}/live?section=wireguard`)
      const data = await res.json()
      if (data.ok) {
        setIfaces(data.data.interfaces || [])
        setPeers(data.data.peers || [])
        setError("")
      } else {
        setError(data.error || "Error de conexión")
      }
    } catch (err) {
      setError(String(err))
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    const first = setTimeout(fetchData, 0)
    const timer = setInterval(fetchData, 15000)
    return () => { clearTimeout(first); clearInterval(timer) }
  }, [fetchData])

  if (loading && ifaces.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">
          <WifiOff className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-700/50 dark:bg-neutral-800/50">
        <div className="flex items-center justify-between border-b border-neutral-200 p-4 dark:border-neutral-700/50">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Interfaces WireGuard</h3>
          <button onClick={() => { setLoading(true); fetchData() }} className="flex items-center gap-1 rounded-lg border border-neutral-300 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700">
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refrescar
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700/50">
                <th className="px-4 py-3 text-xs font-medium text-neutral-500">Estado</th>
                <th className="px-4 py-3 text-xs font-medium text-neutral-500">Nombre</th>
                <th className="px-4 py-3 text-xs font-medium text-neutral-500">Puerto</th>
                <th className="px-4 py-3 text-xs font-medium text-neutral-500">Clave pública</th>
                <th className="px-4 py-3 text-xs font-medium text-neutral-500">MTU</th>
                <th className="px-4 py-3 text-xs font-medium text-neutral-500">Comentario</th>
              </tr>
            </thead>
            <tbody>
              {ifaces.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-500">Sin interfaces WireGuard (¿RouterOS v7?)</td></tr>
              ) : ifaces.map(i => (
                <tr key={i.name} className="border-b border-neutral-100 dark:border-neutral-700/30">
                  <td className="px-4 py-3">
                    {i.disabled ? (
                      <span className="rounded-full bg-neutral-500/10 px-2 py-0.5 text-xs text-neutral-500">Disabled</span>
                    ) : i.running ? (
                      <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-500">Running</span>
                    ) : (
                      <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-500">Caída</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">{i.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-500">{i.listenPort || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-500">{i.publicKey?.substring(0, 44)}…</td>
                  <td className="px-4 py-3 text-xs text-neutral-500">{i.mtu || "—"}</td>
                  <td className="px-4 py-3 text-xs text-neutral-400">{i.comment || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-700/50 dark:bg-neutral-800/50">
        <div className="border-b border-neutral-200 p-4 dark:border-neutral-700/50">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Peers</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700/50">
                <th className="px-4 py-3 text-xs font-medium text-neutral-500">Interfaz</th>
                <th className="px-4 py-3 text-xs font-medium text-neutral-500">Endpoint</th>
                <th className="px-4 py-3 text-xs font-medium text-neutral-500">Allowed Address</th>
                <th className="px-4 py-3 text-xs font-medium text-neutral-500">Handshake</th>
                <th className="px-4 py-3 text-xs font-medium text-neutral-500">RX</th>
                <th className="px-4 py-3 text-xs font-medium text-neutral-500">TX</th>
                <th className="px-4 py-3 text-xs font-medium text-neutral-500">Estado</th>
              </tr>
            </thead>
            <tbody>
              {peers.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-neutral-500">Sin peers WireGuard</td></tr>
              ) : peers.map((p, i) => (
                <tr key={i} className="border-b border-neutral-100 dark:border-neutral-700/30">
                  <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">{p.interface || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                    {p.endpointAddress ? `${p.endpointAddress}:${p.endpointPort}` : "— (offline)"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-500">{p.allowedAddress || "—"}</td>
                  <td className="px-4 py-3 text-xs text-neutral-500">{p.lastHandshake || "Nunca"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-green-500">{formatBytes(p.rxBytes)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-blue-500">{formatBytes(p.txBytes)}</td>
                  <td className="px-4 py-3">
                    {p.disabled ? (
                      <span className="rounded-full bg-neutral-500/10 px-2 py-0.5 text-xs text-neutral-500">Disabled</span>
                    ) : p.lastHandshake && p.lastHandshake !== "never" ? (
                      <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-500">Conectado</span>
                    ) : (
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-500">Sin handshake</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}