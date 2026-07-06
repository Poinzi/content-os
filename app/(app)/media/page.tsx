import { getTenantContext } from "@/lib/tenant";
import { getFolders, getMedia } from "@/lib/data";
import { PageHeader } from "@/components/ui/page-header";
import { MediaLibrary } from "@/components/features/media/media-library";

export default async function MediaPage() {
  const ctx = await getTenantContext();
  if (!ctx) return null;
  const [media, folders] = await Promise.all([
    getMedia(ctx.org.id),
    getFolders(ctx.org.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Media Library"
        description="Lataa, järjestä ja hae kuvat ja videot."
      />
      <MediaLibrary media={media} folders={folders} />
    </div>
  );
}
