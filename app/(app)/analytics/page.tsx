import Image from "next/image";
import { Eye, Heart, Send, Clock, Sparkles } from "lucide-react";
import { getTenantContext } from "@/lib/tenant";
import { getAnalytics } from "@/lib/data";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { ComingSoon } from "@/components/ui/skeleton";
import { formatCompact } from "@/lib/utils";

export default async function AnalyticsPage() {
  const ctx = await getTenantContext();
  if (!ctx) return null;
  const a = await getAnalytics(ctx.org.id);
  const maxTopic = Math.max(...a.topTopics.map((t) => t.views));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Katselut, sitoutuminen ja parhaat aiheet."
        actions={<ComingSoon version="v3" />}
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          icon={<Eye className="h-4 w-4" />}
          label="Katselut"
          value={formatCompact(a.views)}
        />
        <Kpi
          icon={<Heart className="h-4 w-4" />}
          label="Sitoutuminen"
          value={formatCompact(a.engagement)}
        />
        <Kpi
          icon={<Send className="h-4 w-4" />}
          label="Julkaisut"
          value={String(a.publishedCount)}
        />
        <Kpi
          icon={<Clock className="h-4 w-4" />}
          label="Ka. katseluaika"
          value={`${a.avgWatchSeconds}s`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Parhaat aiheet</CardTitle>
          </CardHeader>
          <CardBody>
            <ul className="space-y-3">
              {a.topTopics.map((t) => (
                <li key={t.topic}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-text-primary">{t.topic}</span>
                    <span className="font-mono text-xs text-text-tertiary">
                      {formatCompact(t.views)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-bg-base">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent-from to-accent-to"
                      style={{ width: `${(t.views / maxTopic) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              AI-ehdotukset
            </CardTitle>
            <ComingSoon version="v3" />
          </CardHeader>
          <CardBody>
            <div className="rounded-lg border border-dashed border-border-strong bg-bg-base p-4">
              <div className="flex items-center gap-2 text-text-primary">
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="text-xs font-semibold">Ehdotus</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                &quot;Datan perusteella kokeile seuraavaksi…&quot; — konkreettisia
                sisältöideoita parhaista aiheista ja sarjoista, suoraan
                Generatoriin.
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Suosituimmat videot</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {a.topVideos.map((v) => (
                <div
                  key={v.title}
                  className="flex items-center gap-3 rounded-md border border-border-subtle bg-bg-base p-3"
                >
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-bg-surface-2">
                    <Image
                      src={v.thumbnailUrl}
                      alt={v.title}
                      fill
                      sizes="80px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-text-primary">
                      {v.title}
                    </div>
                    <div className="text-[11px] text-text-tertiary">
                      {formatCompact(v.views)} katselua
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center gap-2 text-text-tertiary">
          {icon}
          <span className="text-[11px] font-medium uppercase tracking-wider">
            {label}
          </span>
        </div>
        <div className="mt-2 text-2xl font-semibold tracking-display text-text-primary">
          {value}
        </div>
      </CardBody>
    </Card>
  );
}
