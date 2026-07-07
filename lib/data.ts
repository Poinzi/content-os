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
  content_variant_id: string | null;
  content_item_id: string | null;
}
function mapCalendarEvent(r: CalendarRow): CalendarEvent {
  return {
    id: r.id,
    title: r.title,
    channel: r.channel,
    status: r.status,
    scheduledAt: toIso(r.scheduled_at),
    thumbnailUrl: r.thumbnail_url ?? undefined,
    contentVariantId: r.content_variant_id ?? undefined,
    contentItemId: r.content_item_id ?? undefined,
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
  // LEFT JOIN sallii seed-eventit joilla ei ole content_variant_id:tä.
  // Kun content_variant_id on olemassa, käytetään item.title:ää.
  const { rows } = await query<CalendarRow>(
    `SELECT
        ce.id,
        COALESCE(ci.title, ce.title) AS title,
        ce.channel,
        ce.status,
        ce.scheduled_at,
        ce.thumbnail_url,
        ce.content_variant_id,
        cv.content_item_id
     FROM calendar_events ce
     LEFT JOIN content_variants cv ON cv.id = ce.content_variant_id
     LEFT JOIN content_items ci ON ci.id = cv.content_item_id
     WHERE ce.org_id = $1
     ORDER BY ce.scheduled_at`,
    [orgId],
  );
  return rows.map(mapCalendarEvent);
}

export async function getAnalytics(orgId: string): Promise<AnalyticsSummary> {
  if (useMock()) return MOCK_ANALYTICS;
  await ensureReady();

  // KPI:t
  const kpiRes = await query<{
    views: string | number | null;
    engagement_pct: string | number | null;
    avg_watch: string | number | null;
    published_count: string | number | null;
  }>(
    `SELECT
       COALESCE(SUM(m.views), 0) AS views,
       CASE
         WHEN COALESCE(SUM(m.views), 0) > 0
         THEN ROUND(SUM(m.engagement)::numeric / SUM(m.views) * 100, 1)
         ELSE 0
       END AS engagement_pct,
       COALESCE(ROUND(AVG(m.watch_time_seconds)::numeric, 0), 0) AS avg_watch,
       (SELECT COUNT(*) FROM content_items ci
         WHERE ci.org_id = $1::uuid AND ci.status = 'published') AS published_count
     FROM analytics_metrics m
     WHERE m.org_id = $1::uuid`,
    [orgId],
  );
  const kpi = kpiRes.rows[0];
  const totalViews = Number(kpi?.views ?? 0);
  const engagement = Number(kpi?.engagement_pct ?? 0);
  const avgWatch = Number(kpi?.avg_watch ?? 0);
  const publishedCount = Number(kpi?.published_count ?? 0);

  // Top-aiheet
  const topicsRes = await query<{ topic: string; views: string | number }>(
    `SELECT topic, SUM(views) AS views
     FROM analytics_metrics
     WHERE org_id = $1::uuid AND topic IS NOT NULL
     GROUP BY topic
     ORDER BY views DESC
     LIMIT 4`,
    [orgId],
  );
  const topTopics = topicsRes.rows.map((r) => ({
    topic: r.topic,
    views: Number(r.views),
  }));

  // Top-videot: JOIN metriikka → content_variants → content_items → media_assets
  const videosRes = await query<{
    title: string;
    thumbnail_url: string | null;
    views: string | number;
  }>(
    `SELECT ci.title,
            ma.thumbnail_url,
            SUM(m.views) AS views
     FROM analytics_metrics m
     JOIN content_variants cv ON cv.id = m.content_variant_id
     JOIN content_items ci ON ci.id = cv.content_item_id
     LEFT JOIN media_assets ma ON ma.id = ci.media_asset_id
     WHERE m.org_id = $1::uuid AND ci.org_id = $1::uuid
     GROUP BY ci.title, ma.thumbnail_url
     ORDER BY views DESC
     LIMIT 3`,
    [orgId],
  );
  const topVideos = videosRes.rows.map((r) => ({
    title: r.title,
    views: Number(r.views),
    thumbnailUrl: r.thumbnail_url ?? MOCK_ANALYTICS.topVideos[0].thumbnailUrl,
  }));

  // Fallback: jos KPI-views = 0 JA topTopics tyhjä → näkymä ei näytä tyhjää
  if (totalViews === 0 && topTopics.length === 0) {
    return MOCK_ANALYTICS;
  }

  return {
    views: totalViews,
    engagement,
    publishedCount,
    avgWatchSeconds: avgWatch,
    topTopics: topTopics.length > 0 ? topTopics : MOCK_ANALYTICS.topTopics,
    topVideos: topVideos.length > 0 ? topVideos : MOCK_ANALYTICS.topVideos,
  };
}

/* ========== WRITERS ========== */

/**
 * Vaihe 17: päivitä brand_brains-rivin annetut kentät (UPSERT). Dynaaminen
 * SET vain annetuista kentistä, jsonb-kentät JSON.stringify:llä.
 * Mock-tilassa no-op — brand-brain-form päivittää vain paikallista tilaa.
 */
export async function updateBrandBrain(
  orgId: string,
  patch: Partial<
    Pick<
      BrandBrain,
      "writingStyle" | "services" | "targetAudiences" | "toneOfVoice" | "ctas" | "values"
    >
  >,
): Promise<void> {
  if (useMock()) return;
  await ensureReady();

  const sets: string[] = [];
  const cols: string[] = ["org_id"];
  const insertVals: string[] = ["$1::uuid"];
  const params: unknown[] = [orgId];
  let pIndex = 2;

  const push = (col: string, val: unknown, isJsonb: boolean) => {
    cols.push(col);
    insertVals.push(`$${pIndex}${isJsonb ? "::jsonb" : ""}`);
    sets.push(`${col} = EXCLUDED.${col}`);
    params.push(val);
    pIndex++;
  };

  if (patch.writingStyle !== undefined) {
    push("writing_style", patch.writingStyle, false);
  }
  if (patch.toneOfVoice !== undefined) {
    push("tone_of_voice", patch.toneOfVoice, false);
  }
  if (patch.values !== undefined) {
    push("values", patch.values, false);
  }
  if (patch.services !== undefined) {
    push("services", JSON.stringify(patch.services), true);
  }
  if (patch.targetAudiences !== undefined) {
    push("target_audiences", JSON.stringify(patch.targetAudiences), true);
  }
  if (patch.ctas !== undefined) {
    push("ctas", JSON.stringify(patch.ctas), true);
  }

  if (sets.length === 0) return; // ei muutettavia kenttiä

  await query(
    `INSERT INTO brand_brains (${cols.join(", ")})
     VALUES (${insertVals.join(", ")})
     ON CONFLICT (org_id) DO UPDATE SET ${sets.join(", ")}`,
    params,
  );
}

/**
 * Vaihe 17: aktivoi/deaktivoi sisältösarja. Rajaus orgiin.
 * Mock-tilassa no-op.
 */
export async function setSeriesActive(
  orgId: string,
  seriesId: string,
  isActive: boolean,
): Promise<void> {
  if (useMock()) return;
  await ensureReady();
  await query(
    `UPDATE content_series
     SET is_active = $1
     WHERE id = $2::uuid AND org_id = $3::uuid`,
    [isActive, seriesId, orgId],
  );
}

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

/* ========== CALENDAR SCHEDULING ========== */

/**
 * Ajasta variantti julkaisukalenteriin. Poistaa ensin mahdollisen aiemman
 * calendar_events-rivin samalle variantille (peruttu ja uudelleenajastettu
 * ketjua varten), sitten INSERT uusi rivi jonka title tulee itemistä.
 * Lopuksi UPDATE content_variants SET status='scheduled'.
 *
 * Kaikki yhdessä transaktiossa. Rajaus org:iin JOINilla content_items:n kautta.
 */
export async function scheduleVariant(
  orgId: string,
  variantId: string,
  scheduledAt: string,
): Promise<void> {
  if (useMock()) return;
  await ensureReady();
  if (!pool) return;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Poista aiempi rivi jos oli
    await client.query(
      `DELETE FROM calendar_events
       WHERE content_variant_id = $1::uuid
         AND org_id = $2::uuid`,
      [variantId, orgId],
    );
    // Luo uusi rivi — otsikko ja channel tulevat variantin/itemin kautta
    const res = await client.query(
      `INSERT INTO calendar_events
         (org_id, title, channel, status, scheduled_at, content_variant_id)
       SELECT $1::uuid, ci.title, cv.channel, 'scheduled', $2::timestamptz, cv.id
       FROM content_variants cv
       JOIN content_items ci ON ci.id = cv.content_item_id
       WHERE cv.id = $3::uuid AND ci.org_id = $1::uuid
       RETURNING id`,
      [orgId, scheduledAt, variantId],
    );
    if (res.rowCount === 0) {
      throw new Error("Variantti ei löytynyt organisaatiosta");
    }
    // Päivitä variantti scheduled-tilaan (org-tarkistus content_items:n kautta)
    await client.query(
      `UPDATE content_variants
       SET status = 'scheduled'
       WHERE id = $1::uuid
         AND content_item_id IN (
           SELECT id FROM content_items WHERE org_id = $2::uuid
         )`,
      [variantId, orgId],
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Peru ajastus: poista calendar_events-rivi ja palauta variantti approved-tilaan.
 */
export async function unscheduleVariant(
  orgId: string,
  variantId: string,
): Promise<void> {
  if (useMock()) return;
  await ensureReady();
  if (!pool) return;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `DELETE FROM calendar_events
       WHERE content_variant_id = $1::uuid
         AND org_id = $2::uuid`,
      [variantId, orgId],
    );
    await client.query(
      `UPDATE content_variants
       SET status = 'approved'
       WHERE id = $1::uuid
         AND content_item_id IN (
           SELECT id FROM content_items WHERE org_id = $2::uuid
         )`,
      [variantId, orgId],
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Merkitse variantti julkaistuksi (manuaalinen tila-siirtymä).
 * Ei kutsua ulkoisiin API:hin — se on erillinen v2+ vaihe.
 */
export async function markVariantPublished(
  orgId: string,
  variantId: string,
): Promise<void> {
  if (useMock()) return;
  await ensureReady();
  if (!pool) return;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE calendar_events
       SET status = 'published', published_at = NOW()
       WHERE content_variant_id = $1::uuid
         AND org_id = $2::uuid`,
      [variantId, orgId],
    );
    await client.query(
      `UPDATE content_variants
       SET status = 'published'
       WHERE id = $1::uuid
         AND content_item_id IN (
           SELECT id FROM content_items WHERE org_id = $2::uuid
         )`,
      [variantId, orgId],
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
