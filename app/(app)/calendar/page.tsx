import { getTenantContext } from "@/lib/tenant";
import { getCalendarEvents } from "@/lib/data";
import { PageHeader } from "@/components/ui/page-header";
import { ComingSoon } from "@/components/ui/skeleton";
import { WeekCalendar } from "@/components/features/calendar/week-calendar";

export default async function CalendarPage() {
  const ctx = await getTenantContext();
  if (!ctx) return null;
  const events = await getCalendarEvents(ctx.org.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Julkaisukalenteri"
        description="Raahaa julkaisuja. Värit: luonnos · ajastettu · julkaistu."
        actions={<ComingSoon version="v2" />}
      />
      <div className="mb-4 flex items-center gap-4 text-[12px] text-text-tertiary">
        <Legend colorClass="bg-status-neutral" label="Luonnos" />
        <Legend colorClass="bg-status-warning" label="Ajastettu" />
        <Legend colorClass="bg-status-success" label="Julkaistu" />
      </div>
      <WeekCalendar events={events} />
    </div>
  );
}

function Legend({
  colorClass,
  label,
}: {
  colorClass: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${colorClass}`} />
      {label}
    </span>
  );
}
