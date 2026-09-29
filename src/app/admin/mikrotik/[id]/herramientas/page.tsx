"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Radio, Route, Loader2, Send, AlertTriangle } from "lucide-react"

interface PingResult {
  target: string
  results: Array<{ seq: number | null; host: string | null; time: number | null; ttl: number | null; status: string | null }>
  total: number
  sent: number
  received: number
  lost: number
}

interface TraceHop {
  host: string | null
  time: number | null
  status: string | null
}

export default function HerramientasPage() {
  const params = useParams()
  const id = params?.id as string

  const [pingTarget, setPingTarget] = useState("8.8.8.8")
  const [pingCount, setPingCount] = useState(4)
  const [pinging, setPinging] = useState(false)
  const [pingResult, setPingResult] = useState<PingResult | null>(null)

  const [traceTarget, setTraceTarget] = useState("8.8.8.8")
  const [tracing, setTracing] = useState(false)
  const [traceResult, setTraceResult] = useState<TraceHop[] | null>(null)

  const [error, setError] = useState("")

  async function runPing() {
    setPinging(true)
    setError("")
    setPingResult(null)
    try {
      const res = await fetch(`/api/admin/mikrotik/${id}/tools?action=ping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: pingTarget, count: pingCount }),
      })
      const data = await res.json()
      if (data.ok) setPingResult(data.data)
      else setError(data.error || "Error")
    } catch (err) {
      setError(String(err))
    }
    setPinging(false)
  }

  async function runTraceroute() {
    setTracing(true)
    setError("")
    setTraceResult(null)
    try {
      const res = await fetch(`/api/admin/mikrotik/${id}/tools?action=traceroute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: traceTarget }),
      })
      const data = await res.json()
      if (data.ok) setTraceResult(data.data)
      else setError(data.error || "Error")
    } catch (err) {
      setError(String(err))
    }
    setTracing(false)
  }

  const pct = pingResult && pingResult.total > 0 ? ((pingResult.received / pingResult.total) * 100).toFixed(0) : "0"

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {error && (
        <div className="col-span-full flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700/50 dark:bg-neutral-800/50">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          <Radio className="h-4 w-4" /> Ping desde el router
        </h3>
        <div className="flex gap-2">
          <input
            value={pingTarget}
            onChange={e => setPingTarget(e.target.value)}
            placeholder="Dirección a pinguear"
            className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 dark:placeholder-neutral-500"
          />
          <select
            value={pingCount}
            onChange={e => setPingCount(parseInt(e.target.value))}
            className="rounded-lg border border-neutral-300 bg-white px-2 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
          >
            {[1, 3, 4, 5, 10].map(n => <option key={n} value={n}>{n} pings</option>)}
          </select>
          <button
            onClick={runPing}
            disabled={pinging || !pingTarget}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700 disabled:opacity-50"
          >
            {pinging ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Ping
          </button>
        </div>

        {pingResult && (
          <div className="mt-4">
            <div className="mb-2 flex items-center gap-3 text-xs">
              <span className={`rounded-full px-2 py-0.5 font-medium ${pingResult.lost === 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                {pct}% de respuesta ({pingResult.received}/{pingResult.total})
              </span>
            </div>
            <div className="space-y-1">
              {pingResult.results.map((r, i) => (
                <div key={i} className="flex items-center gap-2 font-mono text-xs">
                  <span className="w-10 text-neutral-500">#{r.seq ?? i}</span>
                  {r.status ? (
                    <span className="text-red-500">{r.status}</span>
                  ) : (
                    <span className="text-green-500">time={r.time}ms</span>
                  )}
                  {r.ttl ? <span className="text-neutral-500">ttl={r.ttl}</span> : null}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700/50 dark:bg-neutral-800/50">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          <Route className="h-4 w-4" /> Traceroute desde el router
        </h3>
        <div className="flex gap-2">
          <input
            value={traceTarget}
            onChange={e => setTraceTarget(e.target.value)}
            placeholder="Dirección destino"
            className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 dark:placeholder-neutral-500"
          />
          <button
            onClick={runTraceroute}
            disabled={tracing || !traceTarget}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700 disabled:opacity-50"
          >
            {tracing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Route className="h-4 w-4" />}
            Trazar
          </button>
        </div>

        {traceResult && (
          <div className="mt-4 space-y-1">
            {traceResult.map((hop, i) => (
              <div key={i} className="flex items-center gap-2 font-mono text-xs">
                <span className="w-10 text-neutral-500 text-right">{i + 1}.</span>
                {hop.status && hop.status.toLowerCase().includes("timeout")
                  ? <span className="text-neutral-500">* * * (timeout)</span>
                  : (
                    <>
                      <span className="text-neutral-300">{hop.host || "—"}</span>
                      <span className="text-green-500">{hop.time !== null && hop.time !== undefined ? `${hop.time}ms` : ""}</span>
                    </>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}