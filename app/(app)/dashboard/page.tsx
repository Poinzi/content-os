import Image from "next/image";
import Link from "next/link";
import { Calendar, Sparkles, ArrowRight, Play, Image as ImageIcon } from "lucide-react";
import { getTenantContext } from "@/lib/tenant";
import {
  getAnalytics,
  getCalendarEvents,
  getContentQueue,
  getMedia,
} from "@/lib/data";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill, Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ComingSoon } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatCompact, formatDateTime } from "@/lib/utils";
import { CHANNEL_LABEL } from "@/lib/types";

export default async function DashboardPage() {
  const ctx = await getTenantContext();
  if (!ctx) return null;
  const [calendar, analytics, queue, media] = await Promise.all([
    getCalendarEvents(ctx.org.id),
    getAnalytics(ctx.org.id),
    getContentQueue(ctx.org.id),
    getMedia(ctx.org.id),
  ]);
  const upcoming = calendar.filter((e) => e.status !== "published").slice(0, 4);
  const recentMedia = media.slice(0, 4);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={`${ctx.org.name} · Katsaus tulevaan viikkoon, sisältöjonoon ja avainmittareihin.`}
        actions={
          <Button size="sm" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Luo sisältö
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
        {/* Analytics tiivistelmä */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Analytics-tiivistelmä</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Kpi label="Näytöt" value={formatCompact(analytics.views)} />
              <Kpi label="Sitoutuminen" value={`${analytics.engagement.toFixed(1)} %`} />
              <Kpi label="Julkaistuja" value={String(analytics.publishedCount)} />
              <Kpi label="Katseluaika" value={`${analytics.avgWatchSeconds} s`} />
            </div>
            <div className="mt-6">
              <div className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
                Kärkiaiheet
              </div>
              <ul className="mt-2 space-y-1.5">
                {analytics.topTopics.map((t) => (
                  <li
                    key={t.topic}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-text-secondary">{t.topic}</span>
                    <span className="font-mono text-xs text-text-tertiary">
                      {formatCompact(t.views)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </CardBody>
        </Card>

        {/* AI Generator */}
        <Card className="md:col-span-2 border-accent/30 bg-gradient-to-br from-accent/10 to-accent-to/5">
          <CardHeader className="border-b-0 pb-0">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              AI Generator
            </CardTitle>
            <ComingSoon version="v1" />
          </CardHeader>
          <CardBody>
            <p className="text-sm text-text-secondary">
              Luo kanavakohtaisia versioita mediakirjastosta yhdellä
              napsautuksella. Käyttää organisaation Brand Brain -profiilia.
            </p>
            <div className="mt-6 flex items-center gap-2">
              <Button variant="primary" size="sm" className="gap-2">
                Luo sisältö
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Tulevat julkaisut */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Tulevat julkaisut
            </CardTitle>
            <Link
              href="/calendar"
              className="text-xs text-text-tertiary hover:text-text-secondary"
            >
              Näytä kaikki
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            {upcoming.length === 0 ? (
              <EmptyState
                className="rounded-none border-0"
                title="Ei tulevia julkaisuja"
                description="Aikatauluta ensimmäinen sisältö kalenterista."
              />
            ) : (
              <ul className="divide-y divide-border-subtle">
                {upcoming.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-sm bg-bg-surface-2">
                      {e.thumbnailUrl ? (
                        <Image
                          src={e.thumbnailUrl}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-text-tertiary">
                          <Play className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm text-text-primary">
                        {e.title}
                      </div>
                      <div className="text-[11px] text-text-tertiary">
                        {CHANNEL_LABEL[e.channel]} · {formatDateTime(e.scheduledAt)}
                      </div>
                    </div>
                    <Badge>{e.status === "scheduled" ? "Ajastettu" : "Luonnos"}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Sisältöjono */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Sisältöjono</CardTitle>
            <Link
              href="/content"
              className="text-xs text-text-tertiary hover:text-text-secondary"
            >
              Näytä kaikki
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            {queue.length === 0 ? (
              <EmptyState
                className="rounded-none border-0"
                title="Sisältöjono on tyhjä"
                description="Luo ensimmäinen sisältö Generatorilla."
              />
            ) : (
              <ul className="divide-y divide-border-subtle">
                {queue.slice(0, 5).map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm text-text-primary">
                        {c.title}
                      </div>
                      <div className="text-[11px] text-text-tertiary">
                        {c.seriesName ?? "Ei sarjaa"} ·{" "}
                        {c.channels.map((ch) => CHANNEL_LABEL[ch]).join(", ")}
                      </div>
                    </div>
                    <StatusPill status={c.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Media-esikatselu */}
        <Card className="md:col-span-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Uusimmat mediat
            </CardTitle>
            <Link
              href="/media"
              className="text-xs text-text-tertiary hover:text-text-secondary"
            >
              Selaa kirjastoa
            </Link>
          </CardHeader>
          <CardBody>
            {recentMedia.length === 0 ? (
              <EmptyState
                title="Ei medioita"
                description="Lataa ensimmäinen video tai kuva."
              />
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {recentMedia.map((m) => (
                  <div
                    key={m.id}
                    className="group relative overflow-hidden rounded-md border border-border-subtle bg-bg-surface-2"
                  >
                    <div className="relative aspect-video">
                      <Image
                        src={m.thumbnailUrl}
                        alt={m.title}
                        fill
                        sizes="(min-width: 768px) 25vw, 50vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        unoptimized
                      />
                      {m.kind === "video" ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                          <Play className="h-6 w-6 text-white" />
                        </div>
                      ) : null}
                    </div>
                    <div className="px-3 py-2">
                      <div className="truncate text-xs font-medium text-text-primary">
                        {m.title}
                      </div>
                      <div className="mt-1 text-[10px] uppercase tracking-wider text-text-tertiary">
                        {m.analysisStatus === "done"
                          ? "Analysoitu"
                          : m.analysisStatus === "processing"
                            ? "Analysoidaan…"
                            : m.analysisStatus === "error"
                              ? "Virhe"
                              : "Odottaa"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tracking-display text-text-primary">
        {value}
      </div>
    </div>
  );
}
