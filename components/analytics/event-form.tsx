"use client";

import { useState, useTransition } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "@/app/(dashboard)/analytics/actions";
import type { CalendarEvent, CreateEventInput, EventType, EventPriority } from "@/types/analytics";
import type { RawApplication } from "@/types/analytics";
import { cn } from "@/lib/utils";

export const EVENT_TYPE_CONFIG: Record<EventType, { label: string; color: string; dot: string }> = {
  application: { label: "Application",  color: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30", dot: "bg-indigo-400" },
  interview:   { label: "Interview",    color: "bg-amber-500/15 text-amber-400 border-amber-500/30",   dot: "bg-amber-400" },
  assessment:  { label: "Assessment",   color: "bg-violet-500/15 text-violet-400 border-violet-500/30", dot: "bg-violet-400" },
  hr_call:     { label: "HR Call",      color: "bg-orange-500/15 text-orange-400 border-orange-500/30", dot: "bg-orange-400" },
  follow_up:   { label: "Follow-up",    color: "bg-blue-500/15 text-blue-400 border-blue-500/30",      dot: "bg-blue-400" },
  offer:       { label: "Offer",        color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400" },
  deadline:    { label: "Deadline",     color: "bg-red-500/15 text-red-400 border-red-500/30",         dot: "bg-red-400" },
  note:        { label: "Note",         color: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",      dot: "bg-zinc-400" },
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  event?: CalendarEvent | null;
  defaultDate?: string;
  apps: RawApplication[];
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function toDateInput(iso: string): string {
  return iso.slice(0, 10);
}

export function EventForm({ open, onClose, onSaved, event, defaultDate, apps }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!event;
  const initDate = event
    ? toDatetimeLocal(event.start_time)
    : defaultDate
      ? `${defaultDate}T09:00`
      : `${new Date().toISOString().slice(0, 10)}T09:00`;

  const [title, setTitle] = useState(event?.title ?? "");
  const [eventType, setEventType] = useState<EventType>(event?.event_type ?? "note");
  const [startTime, setStartTime] = useState(initDate);
  const [allDay, setAllDay] = useState(event?.all_day ?? false);
  const [endTime, setEndTime] = useState(event?.end_time ? toDatetimeLocal(event.end_time) : "");
  const [priority, setPriority] = useState<EventPriority>(event?.priority ?? "medium");
  const [description, setDescription] = useState(event?.description ?? "");
  const [applicationId, setApplicationId] = useState(event?.application_id ?? "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function buildInput(): CreateEventInput {
    const base: CreateEventInput = {
      title: title.trim(),
      event_type: eventType,
      start_time: allDay
        ? new Date(startTime.slice(0, 10) + "T00:00:00").toISOString()
        : new Date(startTime).toISOString(),
      all_day: allDay,
      priority,
      description: description.trim() || null,
      application_id: applicationId || null,
    };
    if (endTime && !allDay) {
      base.end_time = new Date(endTime).toISOString();
    }
    return base;
  }

  function handleSave() {
    if (!title.trim()) { setError("Title is required."); return; }
    setError(null);
    startTransition(async () => {
      const input = buildInput();
      if (isEdit) {
        await updateCalendarEvent(event!.id, input);
      } else {
        const res = await createCalendarEvent(input);
        if ("error" in res) { setError(res.error); return; }
      }
      onSaved();
      onClose();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteCalendarEvent(event!.id);
      onSaved();
      onClose();
    });
  }

  const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary";
  const labelCls = "mb-1 block text-xs font-medium text-muted-foreground";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Event" : "New Event"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Title */}
          <div>
            <label className={labelCls}>Title *</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title..."
              className={inputCls}
            />
          </div>

          {/* Event type */}
          <div>
            <label className={labelCls}>Type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
              className={inputCls}
            >
              {(Object.keys(EVENT_TYPE_CONFIG) as EventType[]).map((t) => (
                <option key={t} value={t}>{EVENT_TYPE_CONFIG[t].label}</option>
              ))}
            </select>
          </div>

          {/* All day toggle + date */}
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="rounded"
              />
              All day
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>{allDay ? "Date" : "Start"}</label>
              <input
                type={allDay ? "date" : "datetime-local"}
                value={allDay ? startTime.slice(0, 10) : startTime}
                onChange={(e) => setStartTime(allDay ? e.target.value + "T00:00" : e.target.value)}
                className={inputCls}
              />
            </div>
            {!allDay && (
              <div>
                <label className={labelCls}>End (optional)</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={inputCls}
                />
              </div>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className={labelCls}>Priority</label>
            <div className="flex gap-2">
              {(["low", "medium", "high"] as EventPriority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={cn(
                    "flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium capitalize transition-colors",
                    priority === p
                      ? p === "high"
                        ? "border-red-500/40 bg-red-500/10 text-red-400"
                        : p === "medium"
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                          : "border-blue-500/40 bg-blue-500/10 text-blue-400"
                      : "border-border text-muted-foreground hover:border-border/80"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Link to application */}
          {apps.length > 0 && (
            <div>
              <label className={labelCls}>Linked Application (optional)</label>
              <select
                value={applicationId}
                onChange={(e) => setApplicationId(e.target.value)}
                className={inputCls}
              >
                <option value="">None</option>
                {apps.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.company_name} — {a.position}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className={labelCls}>Notes (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Add notes..."
              className={cn(inputCls, "resize-none")}
            />
          </div>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter className="flex-row gap-2">
          {isEdit && !showDeleteConfirm && (
            <Button
              variant="outline"
              size="sm"
              className="mr-auto border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isPending}
            >
              Delete
            </Button>
          )}
          {isEdit && showDeleteConfirm && (
            <div className="mr-auto flex items-center gap-2">
              <span className="text-xs text-destructive">Delete this event?</span>
              <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isPending}>
                Confirm
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                No
              </Button>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isPending || !title.trim()}>
            {isEdit ? "Save changes" : "Create event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
