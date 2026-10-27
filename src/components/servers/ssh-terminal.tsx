"use client"

import { useEffect, useRef, useState } from "react"
import type { Terminal as XTermTerminal } from "@xterm/xterm"
import type { FitAddon as XTermFitAddon } from "@xterm/addon-fit"
import "@xterm/xterm/css/xterm.css"

export type TerminalState = "conectando" | "activa" | "cerrada" | "error"

interface SshTerminalProps {
  sessionId: string
  onClose?: (error?: string | null) => void
  onStateChange?: (state: TerminalState) => void
}

const TERMINAL_THEME = {
  background: "#0b1120",
  foreground: "#e2e8f0",
  cursor: "#60a5fa",
  cursorAccent: "#0b1120",
  selectionBackground: "rgba(96, 165, 250, 0.35)",
  black: "#1e293b",
  red: "#f87171",
  green: "#34d399",
  yellow: "#fbbf24",
  blue: "#60a5fa",
  magenta: "#c084fc",
  cyan: "#22d3ee",
  white: "#e2e8f0",
  brightBlack: "#64748b",
}

/**
 * Terminal SSH en el navegador.
 *
 * La entrada viaja por POST (agrupada cada ~12 ms) y la salida llega por SSE,
 * así funciona con el servidor Next estándar, sin WebSocket.
 */
export function SshTerminal({ sessionId, onClose, onStateChange }: SshTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [estado, setEstado] = useState<TerminalState>("conectando")

  // Los callbacks van por ref para que un re-render del padre no reinicie la sesión.
  const onCloseRef = useRef(onClose)
  const onStateRef = useRef(onStateChange)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])
  useEffect(() => {
    onStateRef.current = onStateChange
  }, [onStateChange])

  useEffect(() => {
    let disposed = false
    let term: XTermTerminal | null = null
    let fitAddon: XTermFitAddon | null = null
    let resizeObserver: ResizeObserver | null = null
    let inputTimer: ReturnType<typeof setTimeout> | null = null
    let resizeTimer: ReturnType<typeof setTimeout> | null = null
    let pendingInput = ""
    let readAbort: AbortController | null = null

    const setEstadoActual = (next: TerminalState) => {
      if (disposed) return
      setEstado(next)
      onStateRef.current?.(next)
    }

    const post = async (payload: Record<string, unknown>) => {
      try {
        await fetch(`/api/admin/ssh/${sessionId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: payload.tipo === "close",
        })
      } catch {
        /* la sesión pudo cerrarse */
      }
    }

    const flushInput = () => {
      inputTimer = null
      if (!pendingInput) return
      const data = pendingInput
      pendingInput = ""
      void post({ tipo: "input", data })
    }

    const scheduleInput = (data: string) => {
      pendingInput += data
      if (pendingInput.length > 4096) {
        if (inputTimer) clearTimeout(inputTimer)
        flushInput()
        return
      }
      if (!inputTimer) inputTimer = setTimeout(flushInput, 12)
    }

    const scheduleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        resizeTimer = null
        if (!fitAddon || !term) return
        try {
          fitAddon.fit()
        } catch {
          return
        }
        void post({ tipo: "resize", cols: term.cols, rows: term.rows })
      }, 250)
    }

    const handleEvent = (payload: {
      tipo: string
      data?: string
      error?: string | null
      cols?: number
      rows?: number
    }) => {
      if (payload.tipo === "salida" && typeof payload.data === "string") {
        term?.write(payload.data)
        return
      }
      if (payload.tipo === "listo") {
        setEstadoActual("activa")
        return
      }
      if (payload.tipo === "cierre") {
        const failed = Boolean(payload.error)
        setEstadoActual(failed ? "error" : "cerrada")
        const message = failed
          ? `\r\n\x1b[31m[conexión cerrada: ${payload.error}]\x1b[0m\r\n`
          : "\r\n\x1b[33m[sesión finalizada]\x1b[0m\r\n"
        term?.write(message)
        onCloseRef.current?.(payload.error ?? null)
      }
    }

    const stream = async () => {
      readAbort = new AbortController()
      try {
        const response = await fetch(`/api/admin/ssh/${sessionId}`, {
          headers: { Accept: "text/event-stream" },
          signal: readAbort.signal,
          cache: "no-store",
        })
        if (!response.ok || !response.body) {
          throw new Error("No se pudo abrir el flujo de la sesión")
        }
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""
        for (;;) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          let index = buffer.indexOf("\n\n")
          while (index >= 0) {
            const raw = buffer.slice(0, index)
            buffer = buffer.slice(index + 2)
            const line = raw.split("\n").find(chunk => chunk.startsWith("data: "))
            if (line) {
              try {
                handleEvent(JSON.parse(line.slice(6)))
              } catch {
                /* evento ilegible */
              }
            }
            index = buffer.indexOf("\n\n")
          }
        }
      } catch (err) {
        if (disposed) return
        if (err instanceof Error && err.name === "AbortError") return
        setEstadoActual("error")
        term?.write(`\r\n\x1b[31m[${err instanceof Error ? err.message : "Error de conexión"}]\x1b[0m\r\n`)
        onCloseRef.current?.(err instanceof Error ? err.message : "Error de conexión")
      }
    }

    async function boot() {
      const [{ Terminal }, { FitAddon }] = await Promise.all([
        import("@xterm/xterm"),
        import("@xterm/addon-fit"),
      ])
      if (disposed || !containerRef.current) return

      term = new Terminal({
        cursorBlink: true,
        cursorStyle: "block",
        fontFamily: 'var(--font-mono), "JetBrains Mono", "Fira Code", monospace',
        fontSize: 13,
        lineHeight: 1.2,
        scrollback: 8000,
        theme: TERMINAL_THEME,
        allowProposedApi: true,
      })

      fitAddon = new FitAddon()
      term.loadAddon(fitAddon)
      term.open(containerRef.current)
      try {
        fitAddon.fit()
      } catch {
        /* el contenedor aún no tiene tamaño */
      }
      term.focus()

      term.onData(data => scheduleInput(data))
      term.onResize(() => {
        if (!resizeTimer) scheduleResize()
      })

      resizeObserver = new ResizeObserver(() => scheduleResize())
      resizeObserver.observe(containerRef.current)

      void stream()
    }

    void boot()

    return () => {
      disposed = true
      if (inputTimer) clearTimeout(inputTimer)
      if (resizeTimer) clearTimeout(resizeTimer)
      readAbort?.abort()
      resizeObserver?.disconnect()
      void post({ tipo: "close" })
      try {
        term?.dispose()
      } catch {
        /* ya liberado */
      }
    }
  }, [sessionId])

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="h-[70vh] min-h-[420px] w-full overflow-hidden rounded-lg bg-[#0b1120] p-2"
      />
      {estado === "conectando" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 text-sm text-neutral-200">
          Conectando…
        </div>
      )}
      <p className="mt-1 text-[11px] text-[var(--text-muted)]">
        {estado === "activa"
          ? "Sesión activa — pegá con Ctrl+Shift+V"
          : estado === "conectando"
            ? "Estableciendo túnel SSH…"
            : estado === "cerrada"
              ? "Sesión finalizada"
              : "Error de conexión"}
      </p>
    </div>
  )
}
