import type {
  AnalyticsSummary,
  BrandBrain,
  CalendarEvent,
  Channel,
  ContentItem,
  ContentSeries,
  ContentStatus,
  Folder,
  MediaAnalysis,
  MediaAsset,
  Membership,
  Organization,
  OrgRole,
} from "@/lib/types";
import { isEnabled as dbEnabled, query, ensureReady } from "@/lib/db";
import { DEMO_USER_ID } from "@/lib/db/seed";
import {
  MOCK_ANALYTICS,
  MOCK_BRAND_BRAIN,
  MOCK_CALENDAR,
  MOCK_CONTENT_QUEUE,
  MOCK_FOLDERS,
  MOCK_MEDIA,
  MOCK_MEMBERSHIPS,
} from "@/lib/mock/data";

function useMock() {
  return process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true" || !dbEnabled;
}

/* ========== ROW MAPPERS ========== */

interface OrgRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}
function mapOrg(r: OrgRow): Organization {
  return { id: r.id, name: r.name, slug: r.slug, logoUrl: r.logo_url };
}

interface FolderRow {
  id: string;
  name: string;
  parent_id: string | null;
}
function mapFolder(r: FolderRow): Folder {
  return { id: r.id, name: r.name, parentId: r.parent_id };
}

interface MediaRow {
  id: string;
  kind: "image" | "video";
  title: string;
  tags: string[] | null;
  folder_id: string | null;
  thumbnail_url: string;
  duration_seconds: number | null;
  analysis_status: MediaAsset["analysisStatus"];
  analysis: MediaAnalysis | null;
  created_at: Date | string;
}
function mapMedia(r: MediaRow): MediaAsset {
  return {
    id: r.id,
    kind: r.kind,
    title: r.title,
    tags: Array.isArray(r.tags) ? r.tags : [],
    folderId: r.folder_id,
    thumbnailUrl: r.thumbnail_url,
    durationSeconds: r.duration_seconds,
    analysisStatus: r.analysis_status,
    analysis: r.analysis,
    createdAt: toIso(r.created_at),
  };
}

interface ContentItemRow {
  id: string;
  title: string;
  status: ContentStatus;
  media_asset_id: string | null;
  series_name: string | null;
  channels: Channel[] | null;
  created_at: Date | string;
}
function mapContentItem(r: ContentItemRow): ContentItem {
  return {
    id: r.id,
    title: r.title,
    status: r.status,
    mediaAssetId: r.media_asset_id,
    seriesName: r.series_name,
    channels: Array.isArray(r.channels) ? r.channels : [],
    createdAt: toIso(r.created_at),
  };
}

interface CalendarRow {
  id: string;
  title: string;
  channel: Channel;
  status: CalendarEvent["status"];
  scheduled_at: Date | string;
  thumbnail_url: string | null;
}
function mapCalendarEvent(r: CalendarRow): CalendarEvent {
  return {
    id: r.id,
    title: r.title,
    channel: r.channel,
    status: r.status,
    scheduledAt: toIso(r.scheduled_at),
    thumbnailUrl: r.thumbnail_url ?? undefined,
  };
}

interface SeriesRow {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}
function mapSeries(r: SeriesRow): ContentSeries {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    isActive: r.is_active,
  };
}

interface BrandBrainRow {
  writing_style: string | null;
  tone_of_voice: string | null;
  values: string | null;
  services: BrandBrain["services"] | null;
  target_audiences: string[] | null;
  ctas: string[] | null;
}

function toIso(v: Date | string): string {
  return typeof v === "string" ? v : v.toISOString();
}

/* ========== GETTERS ========== */

export async function getMemberships(userId: string = DEMO_USER_ID): Promise<Membership[]> {
  if (useMock()) return MOCK_MEMBERSHIPS;
  await ensureReady();
  const { rows } = await query<OrgRow & { role: OrgRole }>(
    `SELECT o.id, o.name, o.slug, o.logo_url, m.role
     FROM organizations o
     JOIN organization_members m ON m.org_id = o.id
     WHERE m.user_id = $1
     ORDER BY
       CASE m.role
         WHEN 'owner'    THEN 1
         WHEN 'admin'    THEN 2
         WHEN 'editor'   THEN 3
         WHEN 'reviewer' THEN 4
         WHEN 'viewer'   THEN 5
         ELSE 6
       END,
       o.name`,
    [userId],
  );
  if (rows.length === 0) return MOCK_MEMBERSHIPS;
  return rows.map((r) => ({ organization: mapOrg(r), role: r.role }));
}

export async function getActiveOrg(orgId: string): Promise<Organization | null> {
  const list = await getMemberships();
  return list.find((m) => m.organization.id === orgId)?.organization ?? list[0]?.organization ?? null;
}

export async function getMedia(orgId: string): Promise<MediaAsset[]> {
  if (useMock()) return MOCK_MEDIA;
  await ensureReady();
  const { rows } = await query<MediaRow>(
    `SELECT id, kind, title, tags, folder_id, thumbnail_url,
            duration_seconds, analysis_status, analysis, created_at
     FROM media_assets
     WHERE org_id = $1
     ORDER BY created_at DESC`,
    [orgId],
  );
  return rows.map(mapMedia);
}

export async function getFolders(orgId: string): Promise<Folder[]> {
  if (useMock()) return MOCK_FOLDERS;
  await ensureReady();
  const { rows } = await query<FolderRow>(
    `SELECT id, name, parent_id
     FROM folders
     WHERE org_id = $1
     ORDER BY name`,
    [orgId],
  );
  return rows.map(mapFolder);
}

export async function getBrandBrain(orgId: string): Promise<BrandBrain> {
  if (useMock()) return MOCK_BRAND_BRAIN;
  await ensureReady();
  const brainRes = await query<BrandBrainRow>(
    `SELECT writing_style, tone_of_voice, values, services, target_audiences, ctas
     FROM brand_brains
     WHERE org_id = $1
     LIMIT 1`,
    [orgId],
  );
  if (brainRes.rows.length === 0) return MOCK_BRAND_BRAIN;
  const b = brainRes.rows[0];
  const seriesRes = await query<SeriesRow>(
    `SELECT id, name, description, is_active
     FROM content_series
     WHERE org_id = $1
     ORDER BY name`,
    [orgId],
  );
  return {
    writingStyle: b.writing_style ?? "",
    toneOfVoice: b.tone_of_voice ?? "",
    values: b.values ?? "",
    services: Array.isArray(b.services) ? b.services : [],
    targetAudiences: Array.isArray(b.target_audiences) ? b.target_audiences : [],
    ctas: Array.isArray(b.ctas) ? b.ctas : [],
    allowedSeries: seriesRes.rows.map(mapSeries),
  };
}

export async function getContentQueue(orgId: string): Promise<ContentItem[]> {
  if (useMock()) return MOCK_CONTENT_QUEUE;
  await ensureReady();
  const { rows } = await query<ContentItemRow>(
    `SELECT id, title, status, media_asset_id, series_name, channels, created_at
     FROM content_items
     WHERE org_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [orgId],
  );
  return rows.map(mapContentItem);
}

export async function getCalendarEvents(orgId: string): Promise<CalendarEvent[]> {
  if (useMock()) return MOCK_CALENDAR;
  await ensureReady();
  const { rows } = await query<CalendarRow>(
    `SELECT id, title, channel, status, scheduled_at, thumbnail_url
     FROM calendar_events
     WHERE org_id = $1
     ORDER BY scheduled_at`,
    [orgId],
  );
  return rows.map(mapCalendarEvent);
}

export async function getAnalytics(_orgId: string): Promise<AnalyticsSummary> {
  // TODO v3: laske oikeasta datasta (analytics_events tai integraatiot)
  return MOCK_ANALYTICS;
}
