"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, Plus, Check, CalendarDays,
  Clock, Building2, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getCalendarEvents, toggleEventComplete,
} from "@/app/(dashboard)/analytics/actions";
import { EventForm, EVENT_TYPE_CONFIG } from "./event-form";
import type { CalendarEvent, RawApplication } from "@/types/analytics";
import { cn } from "@/lib/utils";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type CalView = "month" | "agenda";

function formatTime(iso: string, allDay: boolean): string {
  if (allDay) return "All day";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function isToday(date: Date): boolean {
  const t = new Date();
  return date.getDate() === t.getDate() &&
    date.getMonth() === t.getMonth() &&
    date.getFullYear() === t.getFullYear();
}

function isOverdue(event: CalendarEvent): boolean {
  return !event.completed && new Date(event.start_time) < new Date() &&
    !["note"].includes(event.event_type);
}

// ── Event chip / card ─────────────────────────────────────────────────────────

function EventChip({
  event,
  compact = false,
  onClick,
  onToggle,
}: {
  event: CalendarEvent;
  compact?: boolean;
  onClick: () => void;
  onToggle: () => void;
}) {
  const cfg = EVENT_TYPE_CONFIG[event.event_type];
  const overdue = isOverdue(event);

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[10px] font-medium transition-opacity",
          event.completed ? "opacity-50" : "",
          overdue ? "ring-1 ring-red-400/50" : "",
          cfg.color
        )}
      >
        <span className={cn("size-1.5 shrink-0 rounded-full", cfg.dot)} />
        <span className="truncate">{event.title}</span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/30",
        event.completed ? "opacity-60" : "",
        overdue ? "border-red-400/30 bg-red-500/5" : "border-border bg-card"
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          event.completed
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border hover:border-primary"
        )}
      >
        {event.completed && <Check className="size-2.5" />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn("rounded-full border px-1.5 py-0.5 text-[9px] font-semibold", cfg.color)}>
            {cfg.label}
          </span>
          {overdue && (
            <span className="rounded-full border border-red-400/30 bg-red-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-red-400">
              Overdue
            </span>
          )}
          {event.priority === "high" && !overdue && (
            <span className="rounded-full border border-red-400/30 bg-red-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-red-400">
              High
            </span>
          )}
        </div>
        <button onClick={onClick} className="mt-0.5 block w-full text-left">
          <p className={cn("text-sm font-medium", event.completed && "line-through text-muted-foreground")}>
            {event.title}
          </p>
        </button>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="size-2.5" />
            {formatTime(event.start_time, event.all_day)}
          </span>
          {event.application && (
            <Link
              href={`/applications/${event.application_id}`}
              className="flex items-center gap-1 text-[10px] text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <Building2 className="size-2.5" />
              <span className="truncate max-w-[140px]">
                {event.application.company_name} · {event.application.position}
              </span>
              <ExternalLink className="size-2 shrink-0" />
            </Link>
          )}
        </div>
        {event.description && (
          <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1">{event.description}</p>
        )}
      </div>
    </div>
  );
}

// ── Month view ────────────────────────────────────────────────────────────────

function MonthView({
  year,
  month,
  events,
  onDayClick,
  onEventClick,
  onToggle,
}: {
  year: number;
  month: number;
  events: CalendarEvent[];
  onDayClick: (dateStr: string) => void;
  onEventClick: (ev: CalendarEvent) => void;
  onToggle: (ev: CalendarEvent) => void;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const cells: { date: Date; isCurrentMonth: boolean }[] = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push({ date: new Date(year, month - 1, daysInPrev - firstDay + 1 + i), isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
  }

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const key = ev.start_time.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(ev);
      map.set(key, list);
    }
    return map;
  }, [events]);

  return (
    // overflow-x-hidden prevents the 7-column grid from causing horizontal scroll
    <div className="w-full overflow-x-hidden">
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {DAY_LABELS.map((d) => (
          <div key={d} className="py-2 text-center text-[10px] font-medium text-muted-foreground sm:text-xs">
            {/* Full label on sm+, single letter on xs */}
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{d[0]}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid — no inline style; min-h on cells adapts at each breakpoint */}
      <div className="grid grid-cols-7">
        {cells.map(({ date, isCurrentMonth }, i) => {
          const key = date.toISOString().slice(0, 10);
          const dayEvents = eventsByDay.get(key) ?? [];
          const today = isToday(date);
          return (
            <div
              key={i}
              className={cn(
                // Mobile: 56px min-height, sm: 72px, md+: 90px
                "relative min-h-[56px] cursor-pointer border-b border-r border-border p-0.5 transition-colors hover:bg-muted/20 sm:min-h-[72px] sm:p-1 md:min-h-[90px]",
                !isCurrentMonth && "opacity-40",
                today && "bg-primary/5"
              )}
              onClick={() => isCurrentMonth && onDayClick(key)}
            >
              {/* Day number circle */}
              <div className={cn(
                "mb-0.5 flex size-5 items-center justify-center rounded-full text-[10px] font-medium sm:mb-1 sm:size-6 sm:text-xs",
                today ? "bg-primary text-primary-foreground" : "text-foreground"
              )}>
                {date.getDate()}
              </div>

              {/* Event chips — cap at 2 on mobile to avoid overflow */}
              <div className="space-y-0.5">
                {dayEvents.slice(0, 2).map((ev) => (
                  <EventChip
                    key={ev.id}
                    event={ev}
                    compact
                    onClick={(e?: any) => { e?.stopPropagation?.(); onEventClick(ev); }}
                    onToggle={() => onToggle(ev)}
                  />
                ))}
                {/* Show third chip only on sm+ */}
                {dayEvents.length > 2 && (
                  <div className="hidden sm:block">
                    {dayEvents[2] && (
                      <EventChip
                        event={dayEvents[2]}
                        compact
                        onClick={(e?: any) => { e?.stopPropagation?.(); onEventClick(dayEvents[2]); }}
                        onToggle={() => onToggle(dayEvents[2])}
                      />
                    )}
                  </div>
                )}
                {/* Overflow count */}
                {dayEvents.length > 3 && (
                  <div className="px-1 text-[9px] text-muted-foreground">
                    +{dayEvents.length - 3} more
                  </div>
                )}
                {/* On mobile, show "N more" when more than 2 */}
                {dayEvents.length > 2 && (
                  <div className="px-1 text-[9px] text-muted-foreground sm:hidden">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Agenda view ───────────────────────────────────────────────────────────────

function AgendaView({
  events,
  onEventClick,
  onToggle,
}: {
  events: CalendarEvent[];
  onEventClick: (ev: CalendarEvent) => void;
  onToggle: (ev: CalendarEvent) => void;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const key = ev.start_time.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(ev);
      map.set(key, list);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, evs]) => ({ date, events: evs }));
  }, [events]);

  if (grouped.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16">
        <CalendarDays className="size-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">No events this month</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-3 sm:p-4">
      {grouped.map(({ date, events: evs }) => (
        <div key={date}>
          <div className={cn(
            "mb-2 flex items-center gap-2",
            isToday(new Date(date + "T12:00:00")) && "text-primary"
          )}>
            <div className={cn(
              "flex size-8 shrink-0 flex-col items-center justify-center rounded-lg text-center",
              isToday(new Date(date + "T12:00:00")) ? "bg-primary text-primary-foreground" : "bg-muted/50 text-foreground"
            )}>
              <span className="text-[9px] font-semibold leading-none">
                {new Date(date + "T12:00:00").toLocaleDateString("en-US", { month: "short" }).toUpperCase()}
              </span>
              <span className="text-sm font-bold leading-tight">
                {new Date(date + "T12:00:00").getDate()}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold">
                {new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" })}
              </p>
              {isToday(new Date(date + "T12:00:00")) && (
                <p className="text-[10px] text-primary">Today</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            {evs.map((ev) => (
              <EventChip
                key={ev.id}
                event={ev}
                onClick={() => onEventClick(ev)}
                onToggle={() => onToggle(ev)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Upcoming / sidebar panel ──────────────────────────────────────────────────

function UpcomingPanel({
  events,
  weeklyGoal,
  apps,
  onEventClick,
  onToggle,
  onCreateNew,
}: {
  events: CalendarEvent[];
  weeklyGoal: number;
  apps: RawApplication[];
  onEventClick: (ev: CalendarEvent) => void;
  onToggle: (ev: CalendarEvent) => void;
  onCreateNew: () => void;
}) {
  const now = new Date();
  const upcoming = events
    .filter((e) => !e.completed && new Date(e.start_time) >= now)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
    .slice(0, 10);

  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  const day = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1));
  const thisWeek = apps.filter((a) => new Date(a.date_applied).getTime() >= weekStart.getTime()).length;
  const goalPct = Math.min(Math.round((thisWeek / Math.max(weeklyGoal, 1)) * 100), 100);

  return (
    /*
      Mobile  : full width, stacked below calendar, border-top
      Tablet+ : w-64 fixed sidebar with border-left
      Desktop : w-72 fixed sidebar with border-left
    */
    <div className="flex w-full shrink-0 flex-col border-t border-border bg-card md:w-64 md:border-l md:border-t-0 lg:w-72">
      {/* Weekly goal */}
      <div className="border-b border-border p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Weekly Goal
          </p>
          <span className="text-xs font-bold text-primary">{thisWeek}/{weeklyGoal}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted/50">
          <div
            className={cn("h-full rounded-full transition-all", goalPct >= 100 ? "bg-emerald-400" : "bg-primary")}
            style={{ width: `${goalPct}%` }}
          />
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">{goalPct}% of weekly goal</p>
      </div>

      {/* Upcoming header */}
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Upcoming</p>
        <button
          onClick={onCreateNew}
          className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary hover:bg-primary/20"
        >
          <Plus className="size-2.5" />
          New
        </button>
      </div>

      {/* Upcoming events list */}
      <div className="px-3 pb-4 md:flex-1 md:overflow-y-auto">
        {upcoming.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <CalendarDays className="size-6 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">No upcoming events</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((ev) => {
              const cfg = EVENT_TYPE_CONFIG[ev.event_type];
              const isOv = isOverdue(ev);
              return (
                <div
                  key={ev.id}
                  className={cn(
                    "cursor-pointer rounded-lg border p-2.5 transition-colors hover:bg-muted/20",
                    isOv ? "border-red-400/30 bg-red-500/5" : "border-border"
                  )}
                  onClick={() => onEventClick(ev)}
                >
                  <div className="flex items-start gap-2">
                    <span className={cn("mt-0.5 size-1.5 shrink-0 rounded-full", cfg.dot)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{ev.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDate(ev.start_time)}
                        {!ev.all_day && ` · ${formatTime(ev.start_time, false)}`}
                      </p>
                      {ev.application && (
                        <p className="truncate text-[10px] text-primary">
                          {ev.application.company_name}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggle(ev); }}
                      className="ml-auto flex size-4 shrink-0 items-center justify-center rounded-full border-2 border-border hover:border-primary"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main planner tab ──────────────────────────────────────────────────────────

interface Props {
  apps: RawApplication[];
  weeklyGoal: number;
  initialUpcoming: CalendarEvent[];
}

export function PlannerTab({ apps, weeklyGoal, initialUpcoming }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [view, setView] = useState<CalView>("month");
  const [events, setEvents] = useState<CalendarEvent[]>(initialUpcoming);
  const [isLoading, startTransition] = useTransition();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [defaultDate, setDefaultDate] = useState<string | undefined>();

  const loadEvents = useCallback((y: number, m: number) => {
    startTransition(async () => {
      const data = await getCalendarEvents(y, m);
      setEvents(data);
    });
  }, []);

  function navigate(dir: -1 | 1) {
    const d = new Date(year, month + dir, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    loadEvents(d.getFullYear(), d.getMonth());
  }

  function handleDayClick(dateStr: string) {
    setSelectedEvent(null);
    setDefaultDate(dateStr);
    setFormOpen(true);
  }

  function handleEventClick(ev: CalendarEvent) {
    setSelectedEvent(ev);
    setDefaultDate(undefined);
    setFormOpen(true);
  }

  function handleToggle(ev: CalendarEvent) {
    const next = !ev.completed;
    setEvents((prev) => prev.map((e) => e.id === ev.id ? { ...e, completed: next } : e));
    startTransition(async () => {
      await toggleEventComplete(ev.id, next);
    });
  }

  function handleSaved() {
    loadEvents(year, month);
  }

  return (
    /*
      Mobile (<768px): flex-col — calendar on top, upcoming panel below; parent scrolls
      Tablet (768px+) and Desktop: flex-row — calendar left, panel right side-by-side
    */
    <div className="flex flex-col overflow-x-hidden md:h-full md:flex-row md:overflow-hidden">

      {/* ── Calendar area ─────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-col md:flex-1 md:overflow-hidden">

        {/* Calendar controls header */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-border px-3 py-3 sm:px-5">

          {/* Left: nav arrows + month label + Today */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate(-1)}
                className="flex size-7 items-center justify-center rounded-lg border border-border hover:bg-muted/50"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => navigate(1)}
                className="flex size-7 items-center justify-center rounded-lg border border-border hover:bg-muted/50"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
            <h2 className="whitespace-nowrap text-sm font-semibold">
              {MONTH_NAMES[month]} {year}
            </h2>
            <button
              onClick={() => {
                const t = new Date();
                setYear(t.getFullYear());
                setMonth(t.getMonth());
                loadEvents(t.getFullYear(), t.getMonth());
              }}
              className="rounded-lg border border-border px-2 py-1 text-xs font-medium hover:bg-muted/50"
            >
              Today
            </button>
          </div>

          {/* Right: view toggle + New Event button */}
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="flex gap-1 rounded-lg border border-border p-0.5">
              {(["month", "agenda"] as CalView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "rounded-md px-2 py-1 text-xs font-medium capitalize transition-colors sm:px-2.5",
                    view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
            <Button
              size="sm"
              className="h-7 gap-1 px-2 text-xs sm:px-3"
              onClick={() => { setSelectedEvent(null); setDefaultDate(undefined); setFormOpen(true); }}
            >
              <Plus className="size-3.5" />
              {/* Full label on sm+, abbreviated on mobile */}
              <span className="hidden sm:inline">New Event</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>

        {/* Calendar body (month grid or agenda list) */}
        <div className={cn(
          "overflow-auto md:flex-1",
          isLoading && "pointer-events-none opacity-60"
        )}>
          {view === "month" ? (
            <MonthView
              year={year}
              month={month}
              events={events}
              onDayClick={handleDayClick}
              onEventClick={handleEventClick}
              onToggle={handleToggle}
            />
          ) : (
            <AgendaView
              events={events}
              onEventClick={handleEventClick}
              onToggle={handleToggle}
            />
          )}
        </div>
      </div>

      {/* ── Upcoming / goal panel ──────────────────────────────────────────── */}
      <UpcomingPanel
        events={events}
        weeklyGoal={weeklyGoal}
        apps={apps}
        onEventClick={handleEventClick}
        onToggle={handleToggle}
        onCreateNew={() => { setSelectedEvent(null); setDefaultDate(undefined); setFormOpen(true); }}
      />

      {/* ── Event form dialog ──────────────────────────────────────────────── */}
      <EventForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setSelectedEvent(null); }}
        onSaved={handleSaved}
        event={selectedEvent}
        defaultDate={defaultDate}
        apps={apps}
      />
    </div>
  );
}
