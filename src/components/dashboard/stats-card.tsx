"use client"

import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color: "blue" | "emerald" | "gold" | "red"
  delay?: number
}

const colorMap = {
  blue: "bg-brand-500/10 text-brand-600 dark:text-brand-400",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  gold: "bg-gold-500/10 text-gold-600 dark:text-gold-400",
  red: "bg-red-500/10 text-red-600 dark:text-red-400",
}

const bgMap = {
  blue: "bg-gradient-to-br from-brand-500/5 to-brand-500/10",
  emerald: "bg-gradient-to-br from-emerald-500/5 to-emerald-500/10",
  gold: "bg-gradient-to-br from-gold-500/5 to-gold-500/10",
  red: "bg-gradient-to-br from-red-500/5 to-red-500/10",
}

export function StatsCard({ title, value, subtitle, icon: Icon, color, delay = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.23, 1, 0.32, 1] }}
      className={`stat-card ${bgMap[color]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--text-muted)]">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-[var(--text-muted)]">{subtitle}</p>}
        </div>
        <div className={`rounded-xl p-3 ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  )
}
