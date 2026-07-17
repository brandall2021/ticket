"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { Menu, X, LogOut, Sun, Moon, User } from "lucide-react"
import {
  Ticket, FileText, Link2, Users, StickyNote, Shield,
  Calculator, Settings, LayoutDashboard, Activity
} from "lucide-react"

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

interface MobileSidebarProps {
  role?: string
  userName?: string
}

export function MobileSidebar({ role: serverRole, userName: serverName }: MobileSidebarProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = serverRole || (session?.user as any)?.role || ""
  const userName = serverName || session?.user?.name || ""

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"))
  }, [])

  function toggleTheme() {
    document.documentElement.classList.toggle("dark")
    const isDark = document.documentElement.classList.contains("dark")
    setDark(isDark)
    localStorage.setItem("theme", isDark ? "dark" : "light")
  }

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-[var(--bg-secondary)] p-2 shadow-md lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-[var(--sidebar-bg)] shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 py-4">
              <span className="text-lg font-bold">Menú</span>
              <button onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-3">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-item ${isActive(item.href) ? "active" : ""}`}
                >
                  <item.icon className="icon" />
                  <span>{item.label}</span>
                </Link>
              ))}
              {role && ["ADMIN", "AGENT", "EDITOR"].includes(role) && (
                <>
                  <div className="my-2 border-t border-[var(--border-color)]" />
                  <span className="px-4 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Administración
                  </span>
                  {adminItems
                    .filter(item => item.href !== "/admin/monitor" || role === "ADMIN")
                    .map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`sidebar-item ${isActive(item.href) ? "active" : ""}`}
                    >
                      <item.icon className="icon" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </>
              )}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 border-t border-[var(--border-color)] p-3 space-y-1">
              {userName && (
                <Link
                  href="/perfil"
                  className={`sidebar-item ${isActive("/perfil") ? "active" : ""}`}
                  onClick={() => setOpen(false)}
                >
                  <User className="icon" />
                  <span className="truncate">{userName}</span>
                </Link>
              )}
              <button
                onClick={toggleTheme}
                className="sidebar-item w-full"
              >
                {dark ? <Sun className="icon" /> : <Moon className="icon" />}
                <span>{dark ? "Claro" : "Oscuro"}</span>
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="sidebar-item w-full text-red-500 hover:text-red-600 dark:text-red-400"
              >
                <LogOut className="icon" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
