"use client"

import { motion } from "framer-motion"
import { Clock, Ticket, FileText, StickyNote } from "lucide-react"
import Link from "next/link"

interface Activity {
  id: string
  type: "ticket" | "nota" | "instructivo"
  title: string
  date: string
  href: string
}

const iconMap = {
  ticket: Ticket,
  nota: StickyNote,
  instructivo: FileText,
}

export function RecentActivity({ items }: { items: Activity[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="card-glass p-6"
    >
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4 text-[var(--text-muted)]" />
        <h2 className="text-sm font-semibold">Actividad Reciente</h2>
      </div>
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--text-muted)]">Sin actividad reciente</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = iconMap[item.type]
            return (
              <Link
                key={item.id}
                href={item.href + item.id}
                className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-[var(--bg-tertiary)]"
              >
                <Icon className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-[var(--text-muted)]">{item.date}</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
