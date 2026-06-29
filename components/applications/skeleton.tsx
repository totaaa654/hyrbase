import { Skeleton } from "@/components/ui/skeleton";

export function ApplicationCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="size-10 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="flex gap-2 pt-0.5">
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-5 w-14 rounded-md" />
            <Skeleton className="h-5 w-20 rounded-md" />
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 border-t border-border/50 pt-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export function ApplicationsGridSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <ApplicationCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ApplicationDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-6">
        <Skeleton className="size-16 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-36" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5">
              <Skeleton className="mb-4 h-4 w-32" />
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="space-y-1.5">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <Skeleton className="mb-4 h-4 w-24" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-6 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
