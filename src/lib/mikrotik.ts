import { RouterOSAPI } from "node-routeros"
import { formatUptime, formatBytes, formatBitrate } from "./format"

export { formatUptime, formatBytes, formatBitrate }

export interface MikrotikRouterConfig {
  host: string
  apiPort: number
  useTls: boolean
  user: string
  password: string
}

interface RosRow {
  [key: string]: string
}

function toInt(v: string | undefined): number | null {
  if (v === undefined || v === null || v === "") return null
  const n = parseInt(v, 10)
  return Number.isNaN(n) ? null : n
}

function toFloat(v: string | undefined): number | null {
  if (v === undefined || v === null || v === "") return null
  const n = parseFloat(v)
  return Number.isNaN(n) ? null : n
}

function toBool(v: string | undefined): boolean {
  return v === "true"
}

export function parseUptimeSec(uptime: string | undefined): number | null {
  if (!uptime) return null
  const regex = /(?:(\d+)w)?(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/
  const m = uptime.match(regex)
  if (!m) return null
  const [, w, d, h, min, s] = m
  return (parseInt(w || "0", 10) * 604800) +
    (parseInt(d || "0", 10) * 86400) +
    (parseInt(h || "0", 10) * 3600) +
    (parseInt(min || "0", 10) * 60) +
    parseInt(s || "0", 10)
}

export class MikrotikError extends Error {
  constructor(message: string, readonly code?: string) {
    super(message)
    this.name = "MikrotikError"
  }
}

async function runCommand(
  config: MikrotikRouterConfig,
  command: string,
  params: string[] = []
): Promise<RosRow[]> {
  const opts: {
    host: string
    user: string
    password: string
    port: number
    timeout: number
    tls?: object
  } = {
    host: config.host,
    user: config.user,
    password: config.password,
    port: config.apiPort,
    timeout: 8,
  }

  if (config.useTls) opts.tls = {}

  const conn = new RouterOSAPI(opts)

  try {
    await conn.connect()
    const rows = (await conn.write(command, ...(params.length > 0 ? [params] : []))) as RosRow[]
    return rows.map(r => ({ ...r }))
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg) throw new MikrotikError(msg)
    throw err
  } finally {
    await conn.close().catch(() => {})
  }
}

export async function testConnection(config: MikrotikRouterConfig) {
  const identidad = await runCommand(config, "/system/identity/print")
  const resource = await runCommand(config, "/system/resource/print", ["=detail="])
  return {
    identidad: identidad[0]?.name || identidad[0]?.identity || null,
    version: resource[0]?.version || null,
    boardName: resource[0]?.["board-name"] || null,
    cpuLoad: toInt(resource[0]?.["cpu-load"]),
    freeMemory: toFloat(resource[0]?.["free-memory"]),
    totalMemory: toFloat(resource[0]?.["total-memory"]),
    uptime: resource[0]?.uptime || null,
  }
}

export async function getResource(config: MikrotikRouterConfig) {
  const rows = await runCommand(config, "/system/resource/print", ["=detail="])
  const r = rows[0] || {}
  return {
    version: r.version || null,
    boardName: r["board-name"] || null,
    architecture: r["architecture-name"] || null,
    cpuLoad: toInt(r["cpu-load"]),
    freeMemory: toFloat(r["free-memory"]),
    totalMemory: toFloat(r["total-memory"]),
    freeHdd: toFloat(r["free-hdd-space"]),
    totalHdd: toFloat(r["total-hdd-space"]),
    uptime: r.uptime || null,
    uptimeSec: parseUptimeSec(r.uptime),
    processes: toInt(r["process-count"]),
  }
}

export async function getIdentity(config: MikrotikRouterConfig) {
  const rows = await runCommand(config, "/system/identity/print")
  return { identity: rows[0]?.name || rows[0]?.identity || null }
}

export async function getInterfaces(config: MikrotikRouterConfig) {
  const rows = await runCommand(config, "/interface/print")
  return rows.map(r => ({
    name: r.name || "",
    type: r.type || null,
    running: toBool(r.running),
    disabled: toBool(r.disabled),
    macAddress: r["mac-address"] || null,
    mtu: toInt(r.mtu),
    rxBytes: toFloat(r["rx-byte"]),
    txBytes: toFloat(r["tx-byte"]),
    rxPackets: toFloat(r["rx-packet"]),
    txPackets: toFloat(r["tx-packet"]),
    rxErrors: toFloat(r["rx-error"]),
    txErrors: toFloat(r["tx-error"]),
    rxDrops: toFloat(r["rx-drop"]),
    txDrops: toFloat(r["tx-drop"]),
    linkDowns: toInt(r["link-downs"]),
    comment: r.comment || null,
  }))
}

export async function getAddresses(config: MikrotikRouterConfig) {
  const rows = await runCommand(config, "/ip/address/print")
  return rows.map(r => ({
    address: r.address || null,
    network: r.network || null,
    broadcast: r.broadcast || null,
    interface: r.interface || null,
    dynamic: toBool(r.dynamic),
    disabled: toBool(r.disabled),
    comment: r.comment || null,
  }))
}

export async function getDhcpLeases(config: MikrotikRouterConfig) {
  const rows = await runCommand(config, "/ip/dhcp-server/lease/print")
  return rows.map(r => ({
    address: r.address || null,
    macAddress: r["mac-address"] || null,
    hostName: r["host-name"] || null,
    server: r.server || null,
    status: r.status || null,
    expiresAfter: r["expires-after"] || null,
    activeAddress: r["active-address"] || null,
    dynamic: toBool(r.dynamic),
    disabled: toBool(r.disabled),
    blocksed: r.blocked || null,
  }))
}

export async function getArp(config: MikrotikRouterConfig) {
  const rows = await runCommand(config, "/ip/arp/print")
  return rows.map(r => ({
    address: r.address || null,
    macAddress: r["mac-address"] || null,
    interface: r.interface || null,
    dynamic: toBool(r.dynamic),
    complete: toBool(r.complete),
    published: toBool(r.published),
  }))
}

export async function getFirewallRules(config: MikrotikRouterConfig, table: "filter" | "nat" | "mangle" = "filter") {
  const rows = await runCommand(config, `/ip/firewall/${table}/print`)
  const validTables = ["filter", "nat", "mangle"] as const
  if (!validTables.includes(table)) table = "filter"
  return rows.map(r => ({
    chain: r.chain || null,
    action: r.action || null,
    protocol: r.protocol || null,
    srcAddress: r["src-address"] || null,
    dstAddress: r["dst-address"] || null,
    srcPort: r["src-port"] || null,
    dstPort: r["dst-port"] || null,
    inInterface: r["in-interface"] || null,
    outInterface: r["out-interface"] || null,
    connectionState: r["connection-state"] || null,
    bytes: toFloat(r.bytes),
    packets: toFloat(r.packets),
    comment: r.comment || null,
    disabled: toBool(r.disabled),
    dynamic: toBool(r.dynamic),
  }))
}

export async function getWireguardInterfaces(config: MikrotikRouterConfig) {
  const rows = await runCommand(config, "/interface/wireguard/print")
  return rows.map(r => ({
    name: r.name || "",
    running: toBool(r.running),
    disabled: toBool(r.disabled),
    publicKey: r["public-key"] || null,
    listenPort: toInt(r["listen-port"]),
    mtu: toInt(r.mtu),
    comment: r.comment || null,
  }))
}

export async function getWireguardPeers(config: MikrotikRouterConfig) {
  const rows = await runCommand(config, "/interface/wireguard/peers/print")
  return rows.map(r => ({
    interface: r.interface || null,
    publicKey: r["public-key"] || null,
    endpointAddress: r["endpoint-address"] || null,
    endpointPort: toInt(r["endpoint-port"]),
    lastHandshake: r["last-handshake"] || null,
    allowedAddress: r["allowed-address"] || null,
    rxBytes: toFloat(r.rx),
    txBytes: toFloat(r.tx),
    running: toBool(r.running),
    disabled: toBool(r.disabled),
    comment: r.comment || null,
  }))
}

export async function getRoutes(config: MikrotikRouterConfig) {
  const rows = await runCommand(config, "/ip/route/print")
  return rows.map(r => ({
    dstAddress: r["dst-address"] || null,
    gateway: r.gateway || null,
    interface: r.interface || null,
    distance: toInt(r.distance),
    routingTable: r["routing-table"] || null,
    dynamic: toBool(r.dynamic),
    disabled: toBool(r.disabled),
    active: toBool(r.active),
    comment: r.comment || null,
  }))
}

export async function getLogs(config: MikrotikRouterConfig, limit = 200) {
  const rows = await runCommand(config, "/log/print", [`=limit=${limit}`])
  return rows.map(r => ({
    time: r.time || null,
    topics: r.topics || null,
    message: r.message || null,
  }))
}

export async function runPingTool(config: MikrotikRouterConfig, address: string, count = 4, size = 64) {
  const rows = await runCommand(config, "/ping", [
    `=address=${address}`,
    `=count=${count}`,
    `=size=${size}`,
  ])
  const results = rows
    .filter(r => r.status !== undefined)
    .map(r => ({
      seq: toInt(r.seq),
      host: r.host || null,
      time: toFloat(r.time),
      ttl: toInt(r.ttl),
      status: r.status || null,
    }))
  const timeoutRows = rows.filter(r => r.timeout !== undefined)
  if (timeoutRows.length > 0) {
    const first = timeoutRows[0]
    results.push({ seq: toInt(first.seq), host: first.host || null, time: null, ttl: null, status: first.timeout })
  }
  return {
    target: address,
    results,
    total: count,
    sent: results.length,
    received: results.filter(r => r.status === undefined && r.time !== null).length,
    lost: results.filter(r => r.status !== undefined || r.time === null).length,
  }
}

export async function runTracerouteTool(config: MikrotikRouterConfig, address: string) {
  const rows = await runCommand(config, "/tool/traceroute", [`=address=${address}`])
  return rows.map(r => ({
    host: r.host || null,
    time: toFloat(r.time),
    status: r.status || null,
    ttl: parseInt(r.host?.split(":")[0] || "", 10) || null,
  }))
}

export function resolveSection(config: MikrotikRouterConfig, section: string) {
  switch (section) {
    case "resource": return getResource(config)
    case "identity": return getIdentity(config)
    case "interfaces": return getInterfaces(config)
    case "addresses": return getAddresses(config)
    case "dhcp": return getDhcpLeases(config)
    case "arp": return getArp(config)
    case "firewall": return getFirewallRules(config, "filter")
    case "nat": return getFirewallRules(config, "nat")
    case "wireguard":
      return Promise.all([getWireguardInterfaces(config), getWireguardPeers(config)])
        .then(([interfaces, peers]) => ({ interfaces, peers }))
    case "routes": return getRoutes(config)
    case "logs": return getLogs(config)
    default: throw new MikrotikError(`Sección desconocida: ${section}`)
  }
}