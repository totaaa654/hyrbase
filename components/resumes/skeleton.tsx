import { Skeleton } from "@/components/ui/skeleton";

export function ResumeCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-start gap-3">
        <Skeleton className="size-12 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2 pt-0.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 flex-1 rounded-md" />
        <Skeleton className="h-8 flex-1 rounded-md" />
        <Skeleton className="size-8 rounded-md" />
      </div>
    </div>
  );
}

export function ResumesGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <ResumeCardSkeleton key={i} />
      ))}
    </div>
  );
}
