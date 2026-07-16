export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5">
      <div className="skeleton mb-3 h-5 w-1/3" />
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="skeleton h-3.5" style={{ width: `${90 - i * 15}%` }} />
        ))}
      </div>
    </div>
  )
}

export function SkeletonStatCard() {
  return (
    <div className="stat-card bg-[var(--bg-tertiary)]">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-8 w-16" />
          <div className="skeleton h-2 w-20" />
        </div>
        <div className="skeleton h-11 w-11 rounded-xl" />
      </div>
    </div>
  )
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl p-3">
          <div className="skeleton h-8 w-8 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}