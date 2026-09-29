"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Cable, Globe, Server, Users, Shield, KeyRound, Route, ScrollText, Wrench, AlertTriangle, FileBarChart, ArrowLeft } from "lucide-react"

const routerNav = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
  { href: "/interfaces", label: "Interfaces", icon: Cable },
  { href: "/direcciones", label: "IPs", icon: Globe },
  { href: "/dhcp", label: "DHCP", icon: Server },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/seguridad", label: "Firewall / NAT", icon: Shield },
  { href: "/wireguard", label: "WireGuard", icon: KeyRound },
  { href: "/rutas", label: "Rutas", icon: Route },
  { href: "/logs", label: "Logs", icon: ScrollText },
  { href: "/herramientas", label: "Herramientas", icon: Wrench },
  { href: "/alertas", label: "Alertas", icon: AlertTriangle },
  { href: "/reportes", label: "Reportes", icon: FileBarChart },
]

export default function MikrotikRouterLayout({ children }: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const id = pathname?.split("/")[3]

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === `/admin/mikrotik/${id}`
    return pathname?.startsWith(`/admin/mikrotik/${id}${href}`)
  }

  return (
    <div className="space-y-4">
      <Link href="/admin/mikrotik" className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
        <ArrowLeft className="h-3 w-3" /> Todos los routers
      </Link>

      <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-neutral-200 bg-white p-1 dark:border-neutral-700/50 dark:bg-neutral-800/50">
        {routerNav.map(item => (
          <Link
            key={item.href}
            href={id ? `/admin/mikrotik/${id}${item.href}` : "/admin/mikrotik"}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              isActive(item.href)
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700/50 dark:hover:text-neutral-100"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  )
}