"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
  Ticket, FileText, Link2, Users, StickyNote, Shield,
  Calculator, Settings, LayoutDashboard, ChevronLeft, ChevronRight,
  Activity, LogOut, Sun, Moon, User
} from "lucide-react"
import { useState, useEffect } from "react"

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
  { href: "/admin/monitor", label: "Monitorización", icon: Activity },
]

interface SidebarProps {
  role?: string
  userName?: string
}

export function Sidebar({ role: serverRole, userName: serverName }: SidebarProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"))
  }, [])

  function toggleTheme() {
    document.documentElement.classList.toggle("dark")
    const isDark = document.documentElement.classList.contains("dark")
    setDark(isDark)
    localStorage.setItem("theme", isDark ? "dark" : "light")
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = serverRole || (session?.user as any)?.role || ""
  const userName = serverName || session?.user?.name || ""

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  const isAdmin = role === "ADMIN"
  const showAdmin = role && ["ADMIN", "AGENT", "EDITOR"].includes(role)

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

        {showAdmin && (
          <>
            <div className="my-2 border-t border-[var(--border-color)]" />
            {!collapsed && (
              <span className="px-4 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Administración
              </span>
            )}
            {adminItems
              .filter(item => item.href !== "/admin/monitor" || isAdmin)
              .map(item => (
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

      <div className="flex flex-col gap-1 px-3">
        {!collapsed && userName && (
          <Link
            href="/perfil"
            className={`sidebar-item ${isActive("/perfil") ? "active" : ""}`}
            title="Mi perfil"
          >
            <User className="icon" />
            <span className="truncate">{userName}</span>
          </Link>
        )}
        <button
          onClick={toggleTheme}
          className="sidebar-item"
          title={dark ? "Modo claro" : "Modo oscuro"}
        >
          {dark ? <Sun className="icon" /> : <Moon className="icon" />}
          {!collapsed && <span>{dark ? "Claro" : "Oscuro"}</span>}
        </button>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="sidebar-item text-red-500 hover:text-red-600 dark:text-red-400"
          title="Cerrar sesión"
        >
          <LogOut className="icon" />
          {!collapsed && <span>Salir</span>}
        </button>
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
