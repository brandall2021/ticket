"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, Server, History, FileBarChart } from "lucide-react"

const monitorNav = [
  { href: "/admin/monitor", label: "Dashboard", icon: Activity },
  { href: "/admin/monitor/hosts", label: "Hosts", icon: Server },
  { href: "/admin/monitor/history", label: "Historial", icon: History },
  { href: "/admin/monitor/reports", label: "Reportes", icon: FileBarChart },
]

export default function MonitorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/admin/monitor") return pathname === "/admin/monitor"
    return pathname.startsWith(href)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 rounded-xl border border-neutral-200 bg-white p-1 dark:border-neutral-700/50 dark:bg-neutral-800/50">
        {monitorNav.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
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
