"use client";

import { useMemo, useState } from "react";
import { CHANNEL_LABEL, type CalendarEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Ma", "Ti", "Ke", "To", "Pe", "La", "Su"];

interface Props {
  events: CalendarEvent[];
}

export function WeekCalendar({ events: initial }: Props) {
  const [events, setEvents] = useState<CalendarEvent[]>(initial);
  const [dragId, setDragId] = useState<string | null>(null);

  const week = useMemo(() => {
    // Ankkuroi ensimmäiseen tapahtumaan tai nyt-hetkeen
    const anchor = events.length > 0 ? new Date(events[0].scheduledAt) : new Date();
    const day = (anchor.getDay() + 6) % 7; // 0 = Ma
    const monday = new Date(anchor);
    monday.setDate(anchor.getDate() - day);
    monday.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [events]);

  const eventsForDay = (d: Date) =>
    events.filter((e) => {
      const t = new Date(e.scheduledAt);
      return (
        t.getFullYear() === d.getFullYear() &&
        t.getMonth() === d.getMonth() &&
        t.getDate() === d.getDate()
      );
    });

  const onDrop = (d: Date) => {
    if (!dragId) return;
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== dragId) return e;
        const old = new Date(e.scheduledAt);
        const next = new Date(d);
        next.setHours(old.getHours(), old.getMinutes(), 0, 0);
        return { ...e, scheduledAt: next.toISOString() };
      }),
    );
    setDragId(null);
  };

  return (
    <div className="grid grid-cols-7 gap-2">
      {week.map((d, i) => {
        const dayEvents = eventsForDay(d);
        return (
          <div
            key={d.toISOString()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(d)}
            className="min-h-[220px] rounded-lg border border-border-subtle bg-bg-surface p-2"
          >
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
                {WEEKDAYS[i]}
              </span>
              <span className="text-lg font-semibold tracking-display text-text-primary">
                {d.getDate()}
              </span>
            </div>
            <div className="space-y-1.5">
              {dayEvents.map((e) => (
                <EventChip
                  key={e.id}
                  event={e}
                  active={dragId === e.id}
                  onDragStart={() => setDragId(e.id)}
                  onDragEnd={() => setDragId(null)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EventChip({
  event,
  active,
  onDragStart,
  onDragEnd,
}: {
  event: CalendarEvent;
  active: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const statusStyle: Record<CalendarEvent["status"], string> = {
    draft: "border-l-status-neutral bg-[#1a1d24]",
    scheduled: "border-l-status-warning bg-[#241f14]",
    published: "border-l-status-success bg-[#14211a]",
  };
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "cursor-grab select-none rounded-md border border-border-subtle border-l-2 px-2 py-1.5 text-[11px] transition-opacity active:cursor-grabbing",
        statusStyle[event.status],
        active && "opacity-50",
      )}
    >
      <div className="truncate font-medium text-text-primary">
        {event.title}
      </div>
      <div className="text-text-tertiary">{CHANNEL_LABEL[event.channel]}</div>
    </div>
  );
}
