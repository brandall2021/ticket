export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-neutral-200 dark:bg-navy-700 ${className}`}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-neutral-200 p-4 dark:border-navy-700">
      <Skeleton className="mb-2 h-5 w-3/4" />
      <Skeleton className="mb-1 h-4 w-1/2" />
      <Skeleton className="h-4 w-1/4" />
    </div>
  )
}

export function TicketDetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <Skeleton className="h-4 w-24" />
      <div className="rounded-lg border border-neutral-200 p-6 dark:border-navy-700">
        <Skeleton className="mb-4 h-8 w-2/3" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="mt-4 h-20 w-full" />
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="rounded-lg border border-neutral-200 p-6 dark:border-navy-700">
        <Skeleton className="mb-4 h-6 w-32" />
        <Skeleton className="mb-2 h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  )
}

export function TicketsListSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}