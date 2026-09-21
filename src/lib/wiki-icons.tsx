import {
  BookOpen, Wrench, Monitor, Cpu, Network, Printer, Settings2,
  Database, Cloud, Palette, Shield, FileText, Package, Mail, Phone,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { CSSProperties } from "react"

const ICONS: Record<string, LucideIcon> = {
  BookOpen, Wrench, Monitor, Cpu, Network, Printer, Settings2,
  Database, Cloud, Palette, Shield, FileText, Package, Mail, Phone,
}

export function wikiIcon(name: string | null | undefined, fallback: LucideIcon = BookOpen): LucideIcon {
  return (name && ICONS[name]) || fallback
}

export const WIKI_ICON_NAMES = Object.keys(ICONS)

export function WikiIcon({
  name,
  className,
  style,
}: {
  name?: string | null
  className?: string
  style?: CSSProperties
}) {
  const Icon = (name && ICONS[name]) || BookOpen
  return <Icon className={className} style={style} />
}