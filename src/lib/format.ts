export function formatUptime(seconds: number | null | undefined): string {
  if (!seconds) return "—"
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return "—"
  if (bytes === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB", "PB"]
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export function formatBitrate(bps: number | null | undefined): string {
  if (bps === null || bps === undefined || bps < 0) return "—"
  if (bps === 0) return "0 bps"
  const units = ["bps", "Kbps", "Mbps", "Gbps", "Tbps"]
  const i = Math.min(Math.floor(Math.log(bps) / Math.log(1000)), units.length - 1)
  return `${(bps / Math.pow(1000, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}