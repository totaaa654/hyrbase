"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  STATUSES,
  WORK_SETUPS,
  EMPLOYMENT_TYPES,
  SORT_OPTIONS,
  type Status,
  type WorkSetup,
  type EmploymentType,
  type SortOption,
} from "@/types/application";

export interface FilterState {
  search: string;
  status: Status | "all";
  workSetup: WorkSetup | "all";
  employmentType: EmploymentType | "all";
  sort: SortOption;
}

interface FiltersBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  total: number;
  filtered: number;
}

export function FiltersBar({
  filters,
  onChange,
  total,
  filtered,
}: FiltersBarProps) {
  const hasActiveFilters =
    filters.search !== "" ||
    filters.status !== "all" ||
    filters.workSetup !== "all" ||
    filters.employmentType !== "all";

  const set = (patch: Partial<FilterState>) =>
    onChange({ ...filters, ...patch });

  const reset = () =>
    onChange({
      search: "",
      status: "all",
      workSetup: "all",
      employmentType: "all",
      sort: filters.sort,
    });

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by company or position…"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            className="pl-9"
          />
          {filters.search && (
            <button
              onClick={() => set({ search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Sort */}
        <Select
          value={filters.sort}
          onValueChange={(v) => set({ sort: v as SortOption })}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SlidersHorizontal className="size-4 shrink-0 text-muted-foreground" />

        {/* Status filter */}
        <Select
          value={filters.status}
          onValueChange={(v) => set({ status: v as Status | "all" })}
        >
          <SelectTrigger className="h-8 w-auto gap-1.5 border-dashed text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Work setup filter */}
        <Select
          value={filters.workSetup}
          onValueChange={(v) => set({ workSetup: v as WorkSetup | "all" })}
        >
          <SelectTrigger className="h-8 w-auto gap-1.5 border-dashed text-xs">
            <SelectValue placeholder="Work setup" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All setups</SelectItem>
            {WORK_SETUPS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Employment type filter */}
        <Select
          value={filters.employmentType}
          onValueChange={(v) =>
            set({ employmentType: v as EmploymentType | "all" })
          }
        >
          <SelectTrigger className="h-8 w-auto gap-1.5 border-dashed text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {EMPLOYMENT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            className="h-8 gap-1.5 text-xs text-muted-foreground"
          >
            <X className="size-3" />
            Clear filters
          </Button>
        )}

        <span className="ml-auto text-xs text-muted-foreground">
          {filtered === total
            ? `${total} application${total !== 1 ? "s" : ""}`
            : `${filtered} of ${total}`}
        </span>
      </div>
    </div>
  );
}
