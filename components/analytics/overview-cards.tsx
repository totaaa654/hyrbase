"use client";

import { Briefcase, TrendingUp, MessageSquare, Trophy, XCircle, Percent } from "lucide-react";
import type { RawApplication } from "@/types/analytics";
import { cn } from "@/lib/utils";

const ACTIVE_STATUSES = new Set([
  "Applied", "Assessment", "HR Interview", "Technical Interview", "Final Interview",
]);
const INTERVIEW_STATUSES = new Set(["HR Interview", "Technical Interview", "Final Interview"]);
const OFFER_STATUSES = new Set(["Offer", "Accepted"]);
const REJECTION_STATUSES = new Set(["Rejected", "Ghosted", "Withdrawn"]);

interface Props {
  apps: RawApplication[];
}

export function OverviewCards({ apps }: Props) {
  const total = apps.length;
  const active = apps.filter((a) => ACTIVE_STATUSES.has(a.status)).length;
  const interviews = apps.filter((a) => INTERVIEW_STATUSES.has(a.status)).length;
  const offers = apps.filter((a) => OFFER_STATUSES.has(a.status)).length;
  const rejections = apps.filter((a) => REJECTION_STATUSES.has(a.status)).length;
  const successRate = total > 0 ? Math.round((offers / total) * 100) : 0;

  const cards = [
    {
      label: "Total",
      value: total,
      suffix: "",
      icon: Briefcase,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      sub: "Applications tracked",
    },
    {
      label: "Active",
      value: active,
      suffix: "",
      icon: TrendingUp,
      color: "text-violet-400",
      bg: "bg-violet-400/10",
      sub: "In progress",
    },
    {
      label: "Interviews",
      value: interviews,
      suffix: "",
      icon: MessageSquare,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      sub: "Reached interview stage",
    },
    {
      label: "Offers",
      value: offers,
      suffix: "",
      icon: Trophy,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      sub: "Offers received",
    },
    {
      label: "Rejections",
      value: rejections,
      suffix: "",
      icon: XCircle,
      color: "text-red-400",
      bg: "bg-red-400/10",
      sub: "Rejected / ghosted",
    },
    {
      label: "Success Rate",
      value: successRate,
      suffix: "%",
      icon: Percent,
      color: "text-primary",
      bg: "bg-primary/10",
      sub: "Offer conversion",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
      {cards.map(({ label, value, suffix, icon: Icon, color, bg, sub }) => (
        <div
          key={label}
          className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <div className={cn("flex size-7 items-center justify-center rounded-lg", bg)}>
              <Icon className={cn("size-3.5", color)} />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight">
            {value}
            <span className="text-base font-semibold text-muted-foreground">{suffix}</span>
          </p>
          <p className="text-[10px] text-muted-foreground/70">{sub}</p>
        </div>
      ))}
    </div>
  );
}
