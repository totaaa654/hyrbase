"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApplicationCard } from "./application-card";
import { FiltersBar, type FilterState } from "./filters-bar";
import { EmptyState } from "./empty-state";
import type { JobApplication, SortOption } from "@/types/application";

interface ApplicationsClientProps {
  applications: JobApplication[];
}

function sortApplications(apps: JobApplication[], sort: SortOption) {
  return [...apps].sort((a, b) => {
    switch (sort) {
      case "newest":
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case "oldest":
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      case "company":
        return a.company_name.localeCompare(b.company_name);
      case "date_applied":
        return (
          new Date(b.date_applied).getTime() -
          new Date(a.date_applied).getTime()
        );
      default:
        return 0;
    }
  });
}

export function ApplicationsClient({ applications }: ApplicationsClientProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "all",
    workSetup: "all",
    employmentType: "all",
    sort: "newest",
  });

  const filtered = useMemo(() => {
    let result = applications;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (a) =>
          a.company_name.toLowerCase().includes(q) ||
          a.position.toLowerCase().includes(q)
      );
    }

    if (filters.status !== "all") {
      result = result.filter((a) => a.status === filters.status);
    }

    if (filters.workSetup !== "all") {
      result = result.filter((a) => a.work_setup === filters.workSetup);
    }

    if (filters.employmentType !== "all") {
      result = result.filter(
        (a) => a.employment_type === filters.employmentType
      );
    }

    return sortApplications(result, filters.sort);
  }, [applications, filters]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Applications</h1>
          <p className="text-sm text-muted-foreground">
            Track every opportunity in your job search
          </p>
        </div>
        <Button
          asChild
          className="gap-2 border-0"
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

      {/* Filters */}
      <FiltersBar
        filters={filters}
        onChange={setFilters}
        total={applications.length}
        filtered={filtered.length}
      />

      {/* Grid */}
      {applications.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <EmptyState filtered />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((app) => (
            <ApplicationCard key={app.id} application={app} />
          ))}
        </div>
      )}
    </div>
  );
}
