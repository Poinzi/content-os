import type {
  AnalyticsSummary,
  BrandBrain,
  CalendarEvent,
  Channel,
  ContentItem,
  ContentItemDetail,
  ContentSeries,
  ContentStatus,
  ContentVariant,
  Folder,
  MediaAnalysis,
  MediaAsset,
  Membership,
  Organization,
  OrgRole,
} from "@/lib/types";
import { isEnabled as dbEnabled, query, ensureReady, pool } from "@/lib/db";
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

/* ========== WRITERS ========== */

/**
 * Tallenna Vision-analyysi mediaan. Mock-tilassa tai ilman DATABASE_URL:ää
 * ei kirjoiteta mihinkään — kutsuja käsittelee palautetun analyysin
 * pelkästään näkymässä (demo-käyttö).
 */
export async function setMediaAnalysis(
  orgId: string,
  assetId: string,
  analysis: import("@/lib/types").MediaAnalysis,
): Promise<void> {
  if (useMock()) return;
  await ensureReady();
  await query(
    `UPDATE media_assets
     SET analysis = $1::jsonb, analysis_status = 'done'
     WHERE id = $2::uuid AND org_id = $3::uuid`,
    [JSON.stringify(analysis), assetId, orgId],
  );
}

/**
 * Tallenna AI-tuotettu sisältö (content_items + content_variants). Nykyisessä
 * skeemassa content_variants sisältää vain (id, content_item_id, channel, body,
 * status), joten hashtagit ja CTA yhdistetään bodyyn tekstinä (näkyvät suoraan
 * julkaisussa). SEO-paketti palautetaan API-vastauksessa mutta ei tallenneta
 * (seo_bundles-taulu ei ole skeemassa; ei lisätä migraatioita).
 *
 * ai_model-kenttä on ohjeen mukainen mutta ei mene kantaan (content_variants
 * ei sisällä tätä saraketta).
 */
export async function createGeneratedContent(
  orgId: string,
  input: {
    mediaAssetId: string;
    seriesName?: string | null;
    generated: import("@/lib/ai/generate-content").GeneratedContent;
    aiModel: string;
  },
): Promise<{ contentItemId: string }> {
  if (useMock()) return { contentItemId: "demo-content" };
  await ensureReady();
  if (!pool) return { contentItemId: "demo-content" };

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const channels = input.generated.variants.map((v) => v.channel);
    const insertItem = await client.query<{ id: string }>(
      `INSERT INTO content_items (org_id, title, status, media_asset_id, series_name, channels)
       VALUES ($1::uuid, $2, 'draft', $3::uuid, $4, $5::jsonb)
       RETURNING id`,
      [
        orgId,
        input.generated.itemTitle,
        input.mediaAssetId,
        input.seriesName ?? null,
        JSON.stringify(channels),
      ],
    );
    const contentItemId = insertItem.rows[0]?.id;
    if (!contentItemId) throw new Error("content_items INSERT ei palauttanut id:tä");

    for (const variant of input.generated.variants) {
      const hashLine =
        variant.hashtags.length > 0
          ? "\n\n" + variant.hashtags.map((h) => `#${h}`).join(" ")
          : "";
      const ctaLine = variant.cta ? "\n\n" + variant.cta : "";
      const body = variant.body + ctaLine + hashLine;
      await client.query(
        `INSERT INTO content_variants (content_item_id, channel, body, status)
         VALUES ($1::uuid, $2, $3, 'draft')`,
        [contentItemId, variant.channel, body],
      );
    }

    await client.query("COMMIT");
    return { contentItemId };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/* ========== CONTENT VARIANTS: parse/combine ========== */

/**
 * Nykyinen skeema tallentaa vain body-sarakkeen. Vaihe 9 writer yhdisti
 * body + cta + hashtags samaan tekstiin. Parsitaan takaisin näkymässä
 * editoitaviksi kentiksi: viimeisen "hashtag-rivin" ( "#tag #tag" ) ja
 * sitä edeltävän lyhyen CTA-rivin ekstraaminen, muu on body.
 */
function parseVariantBody(fullBody: string): {
  body: string;
  cta: string;
  hashtags: string[];
} {
  const parts = fullBody.split(/\n{2,}/);
  let hashtags: string[] = [];
  let cta = "";

  // Trailing hashtag-linja
  while (parts.length > 0) {
    const last = (parts[parts.length - 1] || "").trim();
    if (!last) {
      parts.pop();
      continue;
    }
    if (/^(?:#\S+\s*)+$/.test(last)) {
      hashtags = (last.match(/#(\S+)/g) ?? []).map((t) => t.slice(1));
      parts.pop();
      continue;
    }
    break;
  }

  // Toissijainen: lyhyt (< 200 merkkiä) rivi = CTA jos > 1 parts
  if (parts.length > 1) {
    const potential = (parts[parts.length - 1] || "").trim();
    if (potential.length > 0 && potential.length < 200) {
      cta = potential;
      parts.pop();
    }
  }

  return {
    body: parts.join("\n\n").trim(),
    cta,
    hashtags,
  };
}

/**
 * Yhdistä editoinnin jälkeen body + cta + hashtags takaisin
 * tallennettavaan tekstiin. Sama muoto kuin Vaihe 9 writerissa.
 */
function combineVariantBody(
  body: string,
  cta: string,
  hashtags: string[],
): string {
  const parts: string[] = [];
  if (body.trim()) parts.push(body.trim());
  if (cta.trim()) parts.push(cta.trim());
  if (hashtags.length > 0) {
    parts.push(hashtags.map((h) => `#${h.replace(/^#+/, "")}`).join(" "));
  }
  return parts.join("\n\n");
}

/* ========== CONTENT ITEM DETAIL ========== */

interface ContentVariantRow {
  id: string;
  channel: Channel;
  body: string;
  status: ContentStatus;
}

function mapContentVariant(r: ContentVariantRow): ContentVariant {
  const parsed = parseVariantBody(r.body);
  return {
    id: r.id,
    channel: r.channel,
    body: parsed.body,
    hashtags: parsed.hashtags,
    cta: parsed.cta,
    status: r.status,
  };
}

function demoContentDetail(itemId: string): ContentItemDetail | null {
  const item = MOCK_CONTENT_QUEUE.find((c) => c.id === itemId) ?? MOCK_CONTENT_QUEUE[0];
  if (!item) return null;
  const variants: ContentVariant[] = item.channels.map((ch, i) => ({
    id: `demo-var-${i}`,
    channel: ch,
    body: `Demo-teksti ${ch}-kanavalle mediasta ${item.title}. Lisää DATABASE_URL nähdäksesi kannassa olevat luonnokset.`,
    hashtags: ["paloturvallisuus", "savuks", "demo"],
    cta: "Ota yhteyttä",
    status: "draft",
  }));
  return { ...item, variants };
}

export async function getContentItem(
  orgId: string,
  itemId: string,
): Promise<ContentItemDetail | null> {
  if (useMock()) return demoContentDetail(itemId);
  await ensureReady();
  const itemRes = await query<ContentItemRow>(
    `SELECT id, title, status, media_asset_id, series_name, channels, created_at
     FROM content_items
     WHERE id = $1::uuid AND org_id = $2::uuid
     LIMIT 1`,
    [itemId, orgId],
  );
  if (itemRes.rows.length === 0) return null;
  const item = mapContentItem(itemRes.rows[0]);
  const variantsRes = await query<ContentVariantRow>(
    `SELECT v.id, v.channel, v.body, v.status
     FROM content_variants v
     JOIN content_items i ON i.id = v.content_item_id
     WHERE v.content_item_id = $1::uuid AND i.org_id = $2::uuid
     ORDER BY v.channel`,
    [itemId, orgId],
  );
  return { ...item, variants: variantsRes.rows.map(mapContentVariant) };
}

/* ========== CONTENT WRITERS ========== */

export async function updateContentVariant(
  orgId: string,
  variantId: string,
  patch: Partial<Pick<ContentVariant, "body" | "hashtags" | "cta" | "status">>,
): Promise<void> {
  if (useMock()) return;
  await ensureReady();

  // Yhdistetään body/hashtags/cta yhdeksi body-kentäksi jos jokin niistä
  // on annettu (schema säilyy: vain body-sarake tallennukselle).
  const sets: string[] = [];
  const params: unknown[] = [];
  let pIndex = 1;

  if (
    patch.body !== undefined ||
    patch.hashtags !== undefined ||
    patch.cta !== undefined
  ) {
    // Tarvitaan nykyiset arvot pohjaksi jos vain osa annetaan
    const cur = await query<ContentVariantRow>(
      `SELECT v.id, v.channel, v.body, v.status
       FROM content_variants v
       JOIN content_items i ON i.id = v.content_item_id
       WHERE v.id = $1::uuid AND i.org_id = $2::uuid
       LIMIT 1`,
      [variantId, orgId],
    );
    if (cur.rows.length === 0) return;
    const parsed = parseVariantBody(cur.rows[0].body);
    const nextBody = combineVariantBody(
      patch.body ?? parsed.body,
      patch.cta ?? parsed.cta,
      patch.hashtags ?? parsed.hashtags,
    );
    sets.push(`body = $${pIndex++}`);
    params.push(nextBody);
  }

  if (patch.status !== undefined) {
    sets.push(`status = $${pIndex++}`);
    params.push(patch.status);
  }

  if (sets.length === 0) return;

  params.push(variantId, orgId);
  await query(
    `UPDATE content_variants
     SET ${sets.join(", ")}
     WHERE id = $${pIndex}::uuid
       AND content_item_id IN (
         SELECT id FROM content_items WHERE org_id = $${pIndex + 1}::uuid
       )`,
    params,
  );
}

export async function updateContentItemStatus(
  orgId: string,
  itemId: string,
  status: ContentStatus,
): Promise<void> {
  if (useMock()) return;
  await ensureReady();
  await query(
    `UPDATE content_items
     SET status = $1
     WHERE id = $2::uuid AND org_id = $3::uuid`,
    [status, itemId, orgId],
  );
}
