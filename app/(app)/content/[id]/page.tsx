import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTenantContext } from "@/lib/tenant";
import { getContentItem } from "@/lib/data";
import { PageHeader } from "@/components/ui/page-header";
import { StatusPill } from "@/components/ui/badge";
import { ContentEditor } from "@/components/features/content/content-editor";

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getTenantContext();
  if (!ctx) return null;
  const item = await getContentItem(ctx.org.id, id);
  if (!item) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/content"
        className="inline-flex items-center gap-1 text-xs text-text-tertiary transition-colors hover:text-text-secondary"
      >
        <ArrowLeft className="h-3 w-3" />
        Sisältöjono
      </Link>
      <PageHeader
        title={item.title}
        description="Muokkaa kanavakohtaisia luonnoksia ja siirrä ne tarkastukseen tai hyväksynnän kautta."
        actions={<StatusPill status={item.status} />}
      />
      <ContentEditor item={item} />
    </div>
  );
}
