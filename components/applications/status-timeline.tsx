import { cn } from "@/lib/utils";
import { STATUS_META, type StatusHistoryEntry } from "@/types/application";

interface StatusTimelineProps {
  history: StatusHistoryEntry[];
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function StatusTimeline({ history }: StatusTimelineProps) {
  if (history.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No history yet.
      </p>
    );
  }

  return (
    <ol className="relative space-y-0">
      {history.map((entry, idx) => {
        const meta = STATUS_META[entry.status as keyof typeof STATUS_META];
        const isLast = idx === history.length - 1;

        return (
          <li key={entry.id} className="relative flex gap-3 pb-6 last:pb-0">
            {/* Connector line */}
            {!isLast && (
              <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border" />
            )}

            {/* Dot */}
            <div
              className={cn(
                "relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border",
                meta
                  ? meta.color.split(" ")[0] + " border-current/20"
                  : "bg-muted border-border"
              )}
            >
              <span
                className={cn(
                  "size-2 rounded-full",
                  meta ? meta.dot : "bg-muted-foreground"
                )}
              />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium text-foreground">
                {entry.status}
              </p>
              {entry.notes && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {entry.notes}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDateTime(entry.changed_at)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
