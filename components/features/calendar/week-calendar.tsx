"use client";

import { useMemo, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CHANNEL_LABEL, type CalendarEvent } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Ma", "Ti", "Ke", "To", "Pe", "La", "Su"];

interface Props {
  events: CalendarEvent[];
}

function mondayOf(d: Date): Date {
  const day = (d.getDay() + 6) % 7; // 0 = Ma
  const m = new Date(d);
  m.setDate(d.getDate() - day);
  m.setHours(0, 0, 0, 0);
  return m;
}

function toISODate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseWeekParam(param: string | null): Date | null {
  if (!param) return null;
  const m = param.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return null;
  return mondayOf(d);
}

function formatWeekRange(start: Date, end: Date): string {
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${start.getDate()}.–${end.getDate()}.${end.getMonth() + 1}.${end.getFullYear()}`;
  }
  if (sameYear) {
    return `${start.getDate()}.${start.getMonth() + 1}.–${end.getDate()}.${end.getMonth() + 1}.${end.getFullYear()}`;
  }
  return `${start.getDate()}.${start.getMonth() + 1}.${start.getFullYear()}–${end.getDate()}.${end.getMonth() + 1}.${end.getFullYear()}`;
}

export function WeekCalendar({ events: initial }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [events, setEvents] = useState<CalendarEvent[]>(initial);
  const [dragId, setDragId] = useState<string | null>(null);

  const initialWeek = useMemo(
    () => parseWeekParam(searchParams.get("week")) ?? mondayOf(new Date()),
    [searchParams],
  );
  const [weekStart, setWeekStart] = useState<Date>(initialWeek);

  const week = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
      }),
    [weekStart],
  );

  const eventsForDay = (d: Date) =>
    events.filter((e) => {
      const t = new Date(e.scheduledAt);
      return (
        t.getFullYear() === d.getFullYear() &&
        t.getMonth() === d.getMonth() &&
        t.getDate() === d.getDate()
      );
    });

  function goToWeek(newMonday: Date) {
    setWeekStart(newMonday);
    router.replace(`${pathname}?week=${toISODate(newMonday)}`);
  }

  function goPrev() {
    const p = new Date(weekStart);
    p.setDate(weekStart.getDate() - 7);
    goToWeek(p);
  }

  function goNext() {
    const n = new Date(weekStart);
    n.setDate(weekStart.getDate() + 7);
    goToWeek(n);
  }

  function goToday() {
    goToWeek(mondayOf(new Date()));
  }

  async function onDrop(d: Date) {
    if (!dragId) return;
    const dropped = events.find((e) => e.id === dragId);
    if (!dropped) {
      setDragId(null);
      return;
    }
    const oldIso = dropped.scheduledAt;
    const old = new Date(oldIso);
    const next = new Date(d);
    next.setHours(old.getHours(), old.getMinutes(), 0, 0);
    const newIso = next.toISOString();

    // Optimistinen paikallinen päivitys
    setEvents((prev) =>
      prev.map((e) => (e.id === dragId ? { ...e, scheduledAt: newIso } : e)),
    );
    setDragId(null);

    // Tallenna kantaan jos linkitys varianttiin on olemassa
    if (dropped.contentVariantId) {
      try {
        const res = await fetch(
          `/api/content/variants/${dropped.contentVariantId}/schedule`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ scheduledAt: newIso }),
          },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } catch (err) {
        console.error("[calendar drag] tallennus epäonnistui:", err);
        // Peru optimistinen muutos
        setEvents((prev) =>
          prev.map((e) =>
            e.id === dropped.id ? { ...e, scheduledAt: oldIso } : e,
          ),
        );
      }
    }
  }

  const weekEnd = week[6];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-medium tracking-display text-text-primary">
          {formatWeekRange(weekStart, weekEnd)}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={goPrev}
            className="gap-1"
            aria-label="Edellinen viikko"
          >
            <ChevronLeft className="h-4 w-4" />
            Edellinen
          </Button>
          <Button size="sm" variant="secondary" onClick={goToday}>
            Tänään
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={goNext}
            className="gap-1"
            aria-label="Seuraava viikko"
          >
            Seuraava
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {week.map((d, i) => {
          const dayEvents = eventsForDay(d);
          return (
            <div
              key={d.toISOString()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => void onDrop(d)}
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
