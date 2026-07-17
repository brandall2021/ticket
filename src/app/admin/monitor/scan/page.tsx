"use client"

import { useState } from "react"
import { Radar, Search, Plus, Check, Loader2, Monitor, Globe, Cpu } from "lucide-react"

interface ScanHost {
  ip: string
  hostname: string
  mac: string
  os: string
  status: "up" | "down"
}

interface Grupo {
  id: string
  nombre: string
  color: string
}

export default function MonitorScanPage() {
  const [range, setRange] = useState("192.168.32.0/22")
  const [scanning, setScanning] = useState(false)
  const [results, setResults] = useState<ScanHost[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [scannedRange, setScannedRange] = useState("")
  const [error, setError] = useState("")
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState<string[]>([])
  const [defaultGrupoId, setDefaultGrupoId] = useState("")
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [notificarAdmin, setNotificarAdmin] = useState(false)

  async function loadGroups() {
    const res = await fetch("/api/admin/monitor")
    if (res.ok) setGrupos(await res.json())
  }

  async function runScan() {
    setScanning(true)
    setError("")
    setResults([])
    setSelected(new Set())
    setImported([])
    await loadGroups()

    try {
      const res = await fetch("/api/admin/monitor/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ range }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Error al escanear")
      } else {
        setResults(data.hosts)
        setScannedRange(data.range)
      }
    } catch {
      setError("Error de conexión")
    }
    setScanning(false)
  }

  function toggleSelect(ip: string) {
    const next = new Set(selected)
    if (next.has(ip)) next.delete(ip)
    else next.add(ip)
    setSelected(next)
  }

  function toggleAll() {
    if (selected.size === results.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(results.map(h => h.ip)))
    }
  }

  async function importSelected() {
    const toImport = results.filter(h => selected.has(h.ip))
    if (toImport.length === 0) return
    setImporting(true)

    const successes: string[] = []
    for (const host of toImport) {
      const nombre = host.hostname || `PC-${host.ip.split(".").pop()}`
      const res = await fetch("/api/admin/monitor/hosts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          ip: host.ip,
          detalle: [host.mac, host.os].filter(Boolean).join(" | ") || null,
          grupoId: defaultGrupoId || null,
          notificarAdmin,
        }),
      })
      if (res.ok) successes.push(host.ip)
    }

    setImported(successes)
    setImporting(false)
  }

  const allImported = results.length > 0 && results.every(h => imported.includes(h.ip))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <Radar className="h-5 w-5 text-blue-500" /> Scan de Red
        </h2>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700/50 dark:bg-neutral-800/50">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-xs text-neutral-500">Rango de red</label>
            <input
              type="text"
              value={range}
              onChange={e => setRange(e.target.value)}
              placeholder="192.168.32.0/22"
              className="h-9 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm font-mono dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
            />
          </div>
          <button
            onClick={runScan}
            disabled={scanning || !range}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
          >
            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {scanning ? "Escaneando..." : "Escanear"}
          </button>
        </div>
        {scanning && (
          <p className="mt-2 text-xs text-neutral-500">Escaneando {range}... esto puede tardar varios minutos.</p>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-500">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-neutral-200 bg-white p-3 text-center dark:border-neutral-700/50 dark:bg-neutral-800/50">
              <p className="text-2xl font-bold text-blue-500">{results.length}</p>
              <p className="text-xs text-neutral-500">Hosts encontrados</p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-3 text-center dark:border-neutral-700/50 dark:bg-neutral-800/50">
              <p className="text-2xl font-bold text-green-500">{results.filter(h => h.os).length}</p>
              <p className="text-xs text-neutral-500">Con OS detectado</p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-3 text-center dark:border-neutral-700/50 dark:bg-neutral-800/50">
              <p className="text-2xl font-bold text-amber-500">{results.filter(h => h.mac).length}</p>
              <p className="text-xs text-neutral-500">Con MAC</p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-3 text-center dark:border-neutral-700/50 dark:bg-neutral-800/50">
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{selected.size}</p>
              <p className="text-xs text-neutral-500">Seleccionados</p>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-700/50 dark:bg-neutral-800/50">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 p-4 dark:border-neutral-700/50">
              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-500">Rango: {scannedRange}</span>
                <button onClick={toggleAll} className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700">
                  {selected.size === results.length ? "Deseleccionar todo" : "Seleccionar todo"}
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select value={defaultGrupoId} onChange={e => setDefaultGrupoId(e.target.value)} className="h-8 rounded-lg border border-neutral-300 bg-white px-2 text-xs dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100">
                  <option value="">Sin grupo</option>
                  {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
                <label className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <input type="checkbox" checked={notificarAdmin} onChange={e => setNotificarAdmin(e.target.checked)} className="rounded" />
                  Notificar
                </label>
                <button
                  onClick={importSelected}
                  disabled={selected.size === 0 || importing || allImported}
                  className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                >
                  {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Importar ({selected.size})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700/50">
                    <th className="w-10 px-4 py-3"><input type="checkbox" checked={selected.size === results.length && results.length > 0} onChange={toggleAll} className="rounded" /></th>
                    <th className="px-4 py-3 text-xs font-medium text-neutral-500">IP</th>
                    <th className="px-4 py-3 text-xs font-medium text-neutral-500">Hostname</th>
                    <th className="px-4 py-3 text-xs font-medium text-neutral-500">MAC Address</th>
                    <th className="px-4 py-3 text-xs font-medium text-neutral-500">Sistema Operativo</th>
                    <th className="px-4 py-3 text-xs font-medium text-neutral-500">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(host => {
                    const isImported = imported.includes(host.ip)
                    return (
                      <tr
                        key={host.ip}
                        onClick={() => !isImported && toggleSelect(host.ip)}
                        className={`border-b border-neutral-100 transition-colors dark:border-neutral-700/30 ${
                          isImported
                            ? "bg-green-500/5 opacity-60"
                            : selected.has(host.ip)
                            ? "bg-blue-500/5 dark:bg-blue-500/10"
                            : "hover:bg-neutral-50 dark:hover:bg-neutral-700/20 cursor-pointer"
                        }`}
                      >
                        <td className="px-4 py-3">
                          {isImported ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <input
                              type="checkbox"
                              checked={selected.has(host.ip)}
                              onChange={() => toggleSelect(host.ip)}
                              onClick={e => e.stopPropagation()}
                              className="rounded"
                            />
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-medium text-neutral-900 dark:text-neutral-100">
                          <div className="flex items-center gap-2">
                            <Globe className="h-3.5 w-3.5 text-neutral-400" />
                            {host.ip}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {host.hostname ? (
                            <span className="text-sm text-neutral-900 dark:text-neutral-100">{host.hostname}</span>
                          ) : (
                            <span className="text-xs text-neutral-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                          {host.mac || <span className="text-neutral-400">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {host.os ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                              <Cpu className="h-3 w-3" />
                              {host.os}
                            </span>
                          ) : (
                            <span className="text-xs text-neutral-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                            host.status === "up" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${host.status === "up" ? "bg-green-500" : "bg-red-500"}`} />
                            {host.status === "up" ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!scanning && results.length === 0 && !error && (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-16 text-center dark:border-neutral-700 dark:bg-neutral-800/50">
          <Radar className="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-600" />
          <p className="mt-3 text-sm text-neutral-500">Escribí un rango de red y hacé click en Escanear</p>
          <p className="mt-1 text-xs text-neutral-400">Ejemplo: 192.168.32.0/22 escanea 192.168.32.0 - 192.168.35.255</p>
        </div>
      )}
    </div>
  )
}
