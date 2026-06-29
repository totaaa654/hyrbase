"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExpandableCardProps {
  title: string;
  preview: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  expandLabel?: string;
}

export function ExpandableCard({
  title,
  preview,
  children,
  defaultExpanded = false,
  expandLabel = "View more",
}: ExpandableCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? "Collapse" : expandLabel}
          {expanded ? (
            <ChevronUp className="size-3" />
          ) : (
            <ChevronDown className="size-3" />
          )}
        </Button>
      </div>

      {/* Preview — visible when collapsed, instantly hidden when expanded */}
      {!expanded && <div className="pt-3">{preview}</div>}

      {/* Full content — smooth height reveal via grid-rows trick */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pt-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
