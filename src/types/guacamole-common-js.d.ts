/**
 * Tipos mínimos de `guacamole-common-js` (el paquete no publica declaraciones).
 * Sólo se declara la superficie que usa el visor RDP.
 */
declare module "guacamole-common-js" {
  export interface GuacamoleStatus {
    code: number
    message: string
    isError(): boolean
  }

  export interface GuacamoleDisplay {
    getElement(): HTMLElement
    getWidth(): number
    getHeight(): number
    scale(scale: number): void
    getScale(): number
    showCursor(visible: boolean): void
  }

  export interface GuacamoleMouseState {
    x: number
    y: number
    left: boolean
    middle: boolean
    right: boolean
    up: boolean
    down: boolean
  }

  export interface GuacamoleClient {
    connect(data?: string): void
    disconnect(): void
    getDisplay(): GuacamoleDisplay
    sendKeyEvent(pressed: number, keysym: number): void
    sendMouseState(state: GuacamoleMouseState, applyDisplayScale?: boolean): void
    sendTouchState?(state: unknown, applyDisplayScale?: boolean): void
    setClipboard(stream: unknown, mimetype: string): void
    createClipboardStream(mimetype: string): unknown
    onstatechange: ((state: number) => void) | null
    onerror: ((status: GuacamoleStatus) => void) | null
    onclipboard: ((stream: unknown, mimetype: string) => void) | null
  }

  export interface GuacamoleMouse {
    onmousedown: ((state: GuacamoleMouseState) => void) | null
    onmouseup: ((state: GuacamoleMouseState) => void) | null
    onmousemove: ((state: GuacamoleMouseState) => void) | null
  }

  export interface GuacamoleKeyboard {
    onkeydown: ((keysym: number) => boolean | void) | null
    onkeyup: ((keysym: number) => boolean | void) | null
    reset(): void
  }

  export interface GuacamoleTunnel {
    connect(data?: string): void
    disconnect(): void
  }

  export interface GuacamoleNamespace {
    Client: {
      new (tunnel: GuacamoleTunnel): GuacamoleClient
      State: {
        IDLE: number
        CONNECTING: number
        WAITING: number
        CONNECTED: number
        DISCONNECTING: number
        DISCONNECTED: number
      }
    }
    WebSocketTunnel: new (url: string) => GuacamoleTunnel
    Mouse: new (element: Element) => GuacamoleMouse
    Keyboard: new (element: Element | Document) => GuacamoleKeyboard
  }

  const Guacamole: GuacamoleNamespace
  export default Guacamole
}
