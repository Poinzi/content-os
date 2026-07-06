import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { getTenantContext } from "@/lib/tenant";
import { getContentQueue } from "@/lib/data";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/badge";
import { CHANNEL_LABEL } from "@/lib/types";

export default async function ContentQueuePage() {
  const ctx = await getTenantContext();
  if (!ctx) return null;
  const queue = await getContentQueue(ctx.org.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sisältöjono"
        description="AI:n tuottamat luonnokset — muokkaa ja hyväksy."
      />
      {queue.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-6 w-6" />}
          title="Ei vielä sisältöä"
          description="Luo ensimmäinen sisältö Media Libraryn 'Luo sisältö' -napista."
          action={
            <Link href="/media">
              <Button className="mt-2 gap-2">
                Siirry Media Libraryyn
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <CardBody className="p-0">
            <ul className="divide-y divide-border-subtle">
              {queue.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/content/${item.id}`}
                    className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-bg-surface-2"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="truncate text-sm font-medium text-text-primary">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-text-tertiary">
                        {item.seriesName ?? "Ei sarjaa"} ·{" "}
                        {item.channels
                          .map((ch) => CHANNEL_LABEL[ch])
                          .join(", ")}
                      </div>
                    </div>
                    <StatusPill status={item.status} />
                    <ArrowRight className="h-4 w-4 text-text-tertiary" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
