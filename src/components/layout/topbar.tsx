"use client"

import Link from "next/link"
import { Moon, Sun, User } from "lucide-react"
import { NotificationBell } from "@/components/notification-bell"
import { useTheme } from "@/components/theme/theme-provider"

export function Topbar({ userName }: { userName: string }) {
  const { theme, toggle } = useTheme()
  const dark = theme === "dark"

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-end border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/95 px-4 pl-16 backdrop-blur sm:px-6 lg:pl-6">
      <div className="flex items-center gap-1 sm:gap-2">
        <Link
          href="/perfil"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
          title="Mi perfil"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
            <User className="h-4 w-4" />
          </span>
          <span className="hidden max-w-40 truncate sm:block">{userName}</span>
        </Link>

        <span className="mx-1 h-6 w-px bg-[var(--border-color)]" />

        <button
          type="button"
          onClick={toggle}
          className="flex h-10 items-center gap-2 rounded-lg px-2.5 text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
          title={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span className="hidden md:inline">{dark ? "Claro" : "Oscuro"}</span>
        </button>

        <NotificationBell />
      </div>
    </header>
  )
}
