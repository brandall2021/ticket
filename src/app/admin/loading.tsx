import { Card, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 animate-pulse rounded bg-neutral-200 dark:bg-navy-700" />
        <div className="flex gap-3">
          <div className="h-9 w-24 animate-pulse rounded-lg bg-neutral-200 dark:bg-navy-700" />
          <div className="h-9 w-24 animate-pulse rounded-lg bg-neutral-200 dark:bg-navy-700" />
          <div className="h-9 w-24 animate-pulse rounded-lg bg-neutral-200 dark:bg-navy-700" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500">
                <div className="h-4 w-24 animate-pulse rounded bg-neutral-200 dark:bg-navy-700" />
              </CardTitle>
            </CardHeader>
            <div className="p-6 pt-0">
              <div className="h-9 w-16 animate-pulse rounded bg-neutral-200 dark:bg-navy-700" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
