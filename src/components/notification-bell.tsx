"use client"

import { Bell } from "lucide-react"
import Link from "next/link"
import { useEffect, useState, useCallback } from "react"

export function NotificationBell() {
  const [count, setCount] = useState(0)

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?noLeidas=true&limit=1")
      if (res.ok) {
        const data = await res.json()
        setCount(data.noLeidas || 0)
      }
    } catch {}
  }, [])

  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [fetchCount])

  return (
    <Link
      href="/notificaciones"
      className="relative flex items-center justify-center rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
      title="Notificaciones"
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  )
}
