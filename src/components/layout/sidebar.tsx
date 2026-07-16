"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Ticket, FileText, Link2, Users, StickyNote, Shield,
  Calculator, Settings, LayoutDashboard, ChevronLeft, ChevronRight
} from "lucide-react"
import { useState } from "react"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/instructivos", label: "Instructivos", icon: FileText },
  { href: "/links", label: "Links", icon: Link2 },
  { href: "/internos", label: "Internos", icon: Users },
  { href: "/notas", label: "Notas", icon: StickyNote },
  { href: "/calculadora", label: "Calculadora", icon: Calculator },
]

const adminItems = [
  { href: "/admin", label: "Admin", icon: Settings },
  { href: "/admin/contrasenas", label: "Contraseñas", icon: Shield },
]

interface SidebarProps {
  role?: string
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <aside
      className="sidebar sticky top-0 flex h-screen flex-col justify-between py-4"
      style={{ width: collapsed ? "var(--sidebar-collapsed-width)" : "var(--sidebar-width)" }}
    >
      <nav className="flex flex-col gap-1 px-3">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-item ${isActive(item.href) ? "active" : ""}`}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="icon" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}

        {role && ["ADMIN", "AGENT", "EDITOR"].includes(role) && (
          <>
            <div className="my-2 border-t border-[var(--border-color)]" />
            {!collapsed && (
              <span className="px-4 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Administración
              </span>
            )}
            {adminItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-item ${isActive(item.href) ? "active" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="icon" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="px-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-item w-full justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          {collapsed ? <ChevronRight className="icon" /> : <ChevronLeft className="icon" />}
        </button>
      </div>
    </aside>
  )
}
