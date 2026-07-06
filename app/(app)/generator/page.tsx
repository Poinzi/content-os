import { Sparkles, ImageIcon, Wand2 } from "lucide-react";
import { getTenantContext } from "@/lib/tenant";
import { getBrandBrain } from "@/lib/data";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ComingSoon } from "@/components/ui/skeleton";
import { CHANNEL_LABEL, type Channel } from "@/lib/types";

const CHANNELS: Channel[] = ["tiktok", "instagram", "facebook", "linkedin", "blog"];

export default async function GeneratorPage() {
  const ctx = await getTenantContext();
  if (!ctx) return null;
  const brand = await getBrandBrain(ctx.org.id);
  const activeSeries = brand.allowedSeries.filter((s) => s.isActive);

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Generator"
        description="Media → julkaisuvalmis sisältö kaikille kanaville."
        actions={<ComingSoon version="v1" />}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody className="space-y-6">
            <Step
              n={1}
              icon={<ImageIcon className="h-4 w-4" />}
              title="Valitse media"
            >
              <p className="text-sm text-text-secondary">
                Valitse yksi tai useampi kuva/video Media Librarysta, tai tule
                tänne lightboxin &quot;Luo sisältö&quot; -napista.
              </p>
            </Step>

            <Step
              n={2}
              icon={<Wand2 className="h-4 w-4" />}
              title="Valitse sisältösarja (valinnainen)"
            >
              {activeSeries.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {activeSeries.map((s) => (
                    <span
                      key={s.id}
                      className="rounded-full border border-border-subtle bg-bg-surface-2 px-3 py-1 text-[12px] text-text-secondary"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-tertiary">
                  Ei aktiivisia sarjoja. Aktivoi Brand Brain -sivulla.
                </p>
              )}
              <p className="mt-3 text-xs text-text-tertiary">
                Sisältö luodaan {ctx.org.name}:n Brand Brainin mukaan — ei
                promptikenttää.
              </p>
            </Step>

            <Step
              n={3}
              icon={<Sparkles className="h-4 w-4" />}
              title="Luo sisältö"
            >
              <Button disabled className="gap-2">
                <Sparkles className="h-4 w-4" />
                Luo sisältö (tulossa v1)
              </Button>
            </Step>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tuotetaan kanaville</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2">
            {CHANNELS.map((ch) => (
              <div
                key={ch}
                className="flex items-center justify-between rounded-md border border-border-subtle bg-bg-base px-3 py-2"
              >
                <span className="text-sm text-text-primary">
                  {CHANNEL_LABEL[ch]}
                </span>
                <ComingSoon version="v1" />
              </div>
            ))}
            <div className="flex items-center justify-between rounded-md border border-border-subtle bg-bg-base px-3 py-2">
              <span className="text-sm text-text-primary">
                SEO Title + Meta Description
              </span>
              <ComingSoon version="v1" />
            </div>
            <p className="pt-2 text-xs text-text-tertiary">
              Kaikki tulokset tallentuvat luonnoksiksi, joita voi muokata ennen
              julkaisua.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Step({
  n,
  icon,
  title,
  children,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border-strong bg-bg-base font-mono text-xs text-text-secondary">
        {n}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-accent">{icon}</span>
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        </div>
        {children}
      </div>
    </div>
  );
}
