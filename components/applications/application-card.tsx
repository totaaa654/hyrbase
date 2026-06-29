"use client";

import Link from "next/link";
import { MapPin, Calendar, Clock, AlertCircle, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./status-badge";
import type { JobApplication } from "@/types/application";

interface ApplicationCardProps {
  application: JobApplication;
}

function daysSince(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CompanyInitial({ name }: { name: string }) {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-sm font-bold text-foreground">
      {name[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  const daysSinceApplied = daysSince(application.date_applied);
  const daysSinceUpdated = daysSince(application.updated_at);
  const showFollowUp =
    daysSinceUpdated > 14 &&
    !["Accepted", "Rejected", "Ghosted", "Withdrawn", "Offer"].includes(
      application.status
    );

  return (
    <Link
      href={`/applications/${application.id}`}
      className="group block rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg hover:shadow-black/10"
    >
      <div className="flex items-start gap-3">
        {application.company_logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={application.company_logo_url}
            alt={application.company_name}
            className="size-10 shrink-0 rounded-xl border border-border object-contain p-0.5"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <CompanyInitial name={application.company_name} />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {application.position}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {application.company_name}
              </p>
            </div>
            <StatusBadge status={application.status} size="sm" />
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
              {application.employment_type}
            </span>
            <span className="inline-flex items-center rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
              {application.work_setup}
            </span>
            {application.location && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3 shrink-0" />
                {application.location}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="size-3" />
            {formatDate(application.date_applied)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {daysSinceApplied === 0
              ? "Today"
              : daysSinceApplied === 1
                ? "1 day ago"
                : `${daysSinceApplied} days ago`}
          </span>
        </div>

        {showFollowUp && (
          <span className="flex items-center gap-1 text-xs text-amber-500">
            <AlertCircle className="size-3" />
            Consider following up
          </span>
        )}
      </div>

      {application.salary_amount && (
        <p className="mt-1 text-xs text-muted-foreground">
          <Building2 className="mr-1 inline size-3" />
          {[application.salary_currency, application.salary_amount, application.salary_rate ? `/ ${application.salary_rate}` : null].filter(Boolean).join(" ")}
        </p>
      )}
    </Link>
  );
}
