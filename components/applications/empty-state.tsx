import Link from "next/link";
import { Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  filtered?: boolean;
}

export function EmptyState({ filtered = false }: EmptyStateProps) {
  if (filtered) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-20 text-center">
        <div className="flex size-14 items-center justify-center rounded-xl border border-border bg-muted">
          <Briefcase className="size-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-sm font-semibold text-foreground">
          No applications match your filters
        </h3>
        <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
          Try adjusting your search or filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-24 text-center">
      <div
        className="flex size-16 items-center justify-center rounded-2xl border border-border"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.558 0.288 293 / 0.12), oklch(0.65 0.22 310 / 0.08))",
        }}
      >
        <Briefcase className="size-7 text-primary" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">
        No applications yet
      </h3>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        Start tracking your job search by adding your first application.
      </p>
      <Button
        asChild
        className="mt-6 gap-2 border-0"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.558 0.288 293), oklch(0.65 0.22 310))",
        }}
      >
        <Link href="/applications/new">
          <Plus className="size-4" />
          Add application
        </Link>
      </Button>
    </div>
  );
}
