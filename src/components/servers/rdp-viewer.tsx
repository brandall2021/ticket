"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { GuacamoleClient, GuacamoleDisplay, GuacamoleKeyboard } from "guacamole-common-js"

export type RdpViewerState = "conectando" | "activa" | "cerrada" | "error"

interface RdpViewerProps {
  tunnelUrl: string
  /** Resolución original de la sesión, usada para calcular la escala. */
  width: number
  height: number
  onClose?: () => void
}

/** Keysyms X11 usados para atajos que el navegador intercepta. */
const KEYSYM = {
  ctrl: 0xffe3,
  alt: 0xffe9,
  shift: 0xffe1,
  delete: 0xffff,
  super: 0xffeb,
  tab: 0xff09,
  escape: 0xff1b,
}

export function RdpViewer({ tunnelUrl, width, height, onClose }: RdpViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const clientRef = useRef<GuacamoleClient | null>(null)
  const onCloseRef = useRef(onClose)
  const [estado, setEstado] = useState<RdpViewerState>("conectando")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  const sendKey = useCallback((keysym: number) => {
    clientRef.current?.sendKeyEvent(1, keysym)
    clientRef.current?.sendKeyEvent(0, keysym)
  }, [])

  const sendCtrlAltDel = useCallback(() => {
    const client = clientRef.current
    if (!client) return
    const combo = [KEYSYM.ctrl, KEYSYM.alt, KEYSYM.delete]
    for (const keysym of combo) client.sendKeyEvent(1, keysym)
    for (const keysym of [...combo].reverse()) client.sendKeyEvent(0, keysym)
  }, [])

  const toggleFullscreen = useCallback(() => {
    const element = containerRef.current?.parentElement
    if (!element) return
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void element.requestFullscreen?.()
    }
  }, [])

  useEffect(() => {
    let disposed = false
    let client: GuacamoleClient | null = null
    let display: GuacamoleDisplay | null = null
    let keyboard: GuacamoleKeyboard | null = null
    let resizeObserver: ResizeObserver | null = null

    const applyScale = () => {
      const element = containerRef.current
      if (!display || !element) return
      const box = element.getBoundingClientRect()
      if (box.width < 10 || box.height < 10) return
      const scale = Math.min(box.width / width, box.height / height)
      display.scale(scale > 0.1 ? scale : 0.1)
    }

    async function boot() {
      try {
        const mod = await import("guacamole-common-js")
        if (disposed || !containerRef.current) return
        const Guacamole = mod.default

        // La URL puede llegar como ruta relativa (`/guacamole/...`); WebSocket
        // necesita una URL absoluta, así que se resuelve contra el origen actual.
        const absoluteTunnelUrl = tunnelUrl.startsWith("/")
          ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}${tunnelUrl}`
          : tunnelUrl

        const tunnel = new Guacamole.WebSocketTunnel(absoluteTunnelUrl)
        client = new Guacamole.Client(tunnel)
        clientRef.current = client

        display = client.getDisplay()
        const displayElement = display.getElement()
        displayElement.style.display = "block"
        displayElement.style.margin = "0 auto"
        containerRef.current.appendChild(displayElement)

        const mouse = new Guacamole.Mouse(displayElement)
        const sendMouseState = (state: Parameters<NonNullable<typeof mouse.onmousemove>>[0]) => {
          client?.sendMouseState(state, true)
        }
        mouse.onmousedown = sendMouseState
        mouse.onmouseup = sendMouseState
        mouse.onmousemove = sendMouseState

        keyboard = new Guacamole.Keyboard(document)
        keyboard.onkeydown = (keysym: number) => {
          client?.sendKeyEvent(1, keysym)
          return false
        }
        keyboard.onkeyup = (keysym: number) => {
          client?.sendKeyEvent(0, keysym)
          return false
        }

        client.onstatechange = (state: number) => {
          if (state === Guacamole.Client.State.CONNECTED) {
            setEstado("activa")
            applyScale()
          } else if (state === Guacamole.Client.State.DISCONNECTED) {
            setEstado(current => (current === "error" ? current : "cerrada"))
            onCloseRef.current?.()
          }
        }

        client.onerror = (status) => {
          setError(status?.message || "Error de la sesión RDP")
          setEstado("error")
        }

        applyScale()
        client.connect()

        resizeObserver = new ResizeObserver(() => applyScale())
        if (containerRef.current) resizeObserver.observe(containerRef.current)
        window.addEventListener("resize", applyScale)
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo iniciar el visor RDP")
        setEstado("error")
      }
    }

    void boot()

    return () => {
      disposed = true
      window.removeEventListener("resize", applyScale)
      resizeObserver?.disconnect()
      keyboard?.reset()
      try {
        clientRef.current?.disconnect()
      } catch {
        /* la sesión ya estaba cerrada */
      }
      clientRef.current = null
      client = null
      display = null
    }
  }, [tunnelUrl, width, height])

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={sendCtrlAltDel}
          disabled={estado !== "activa"}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-40 dark:border-navy-600 dark:text-neutral-200 dark:hover:bg-navy-700"
        >
          Ctrl+Alt+Del
        </button>
        <button
          onClick={() => sendKey(KEYSYM.super)}
          disabled={estado !== "activa"}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-40 dark:border-navy-600 dark:text-neutral-200 dark:hover:bg-navy-700"
        >
          Tecla Windows
        </button>
        <button
          onClick={toggleFullscreen}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-navy-600 dark:text-neutral-200 dark:hover:bg-navy-700"
        >
          Pantalla completa
        </button>
        <span className="text-[11px] text-[var(--text-muted)]">
          {estado === "activa"
            ? `Sesión activa (${width}×${height})`
            : estado === "conectando"
              ? "Conectando al escritorio remoto…"
              : estado === "cerrada"
                ? "Sesión finalizada"
                : "Error de conexión"}
        </span>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-[var(--border-color)] bg-black">
        <div ref={containerRef} className="flex h-[70vh] min-h-[420px] w-full items-center justify-center" />
        {estado !== "activa" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 px-6 text-center text-sm text-neutral-200">
            {estado === "conectando" ? (
              <>
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-500 border-t-transparent" />
                Estableciendo sesión RDP…
              </>
            ) : estado === "error" ? (
              <>
                <p className="font-medium text-red-400">No se pudo abrir el escritorio remoto</p>
                <p className="max-w-md text-xs text-neutral-400">{error}</p>
              </>
            ) : (
              <p className="text-neutral-400">La sesión RDP terminó.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
