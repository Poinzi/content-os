import { getTenantContext } from "@/lib/tenant";
import { getBrandBrain } from "@/lib/data";
import { hasRole } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { BrandBrainForm } from "@/components/features/brand-brain/brand-brain-form";

export default async function BrandBrainPage() {
  const ctx = await getTenantContext();
  if (!ctx) return null;
  const brandBrain = await getBrandBrain(ctx.org.id);
  const canEdit = hasRole(ctx.role, "admin");

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Brand Brain"
        description={`${ctx.org.name}:n ääni, palvelut ja säännöt — AI:n perusta.`}
      />
      <BrandBrainForm initial={brandBrain} canEdit={canEdit} />
    </div>
  );
}
