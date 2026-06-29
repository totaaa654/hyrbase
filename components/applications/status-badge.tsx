import { cn } from "@/lib/utils";
import { STATUS_META, type Status } from "@/types/application";

interface StatusBadgeProps {
  status: Status;
  className?: string;
  size?: "sm" | "md";
}

export function StatusBadge({
  status,
  className,
  size = "md",
}: StatusBadgeProps) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        meta.color,
        className
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}
