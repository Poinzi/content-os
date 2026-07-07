import { pool } from "./index";
import { hashPassword } from "@/lib/auth";
import {
  MOCK_MEMBERSHIPS,
  MOCK_BRAND_BRAIN,
  MOCK_FOLDERS,
  MOCK_MEDIA,
  MOCK_CONTENT_QUEUE,
  MOCK_CALENDAR,
} from "@/lib/mock/data";

/**
 * Vakio demo-käyttäjälle. Oikea auth tulee myöhemmässä vaiheessa; nyt kaikki
 * mock-membershipit sidotaan tähän ID:hen jotta getMemberships(DEMO_USER_ID)
 * toimii tuotannossakin.
 */
export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

/**
 * Idempotentti seed: jos organisaatioita on jo, palataan heti. Muuten INSERT
 * kaikki mock-datasta transaktiossa. Kaikki INSERTit ON CONFLICT DO NOTHING
 * jotta osittain seedatut kannat saadaan täydennettyä ilman virhettä.
 *
 * Kaikki mock-id:t ja viitteet ajetaan ensureUuid()-apurin läpi, jotta uuid-
 * sarakkeet saavat validia dataa. Sama syöte tuottaa aina saman uuid:n, joten
 * viite-eheys säilyy (esim. folders.id = ensureUuid("f_kentta") ja
 * media_assets.folder_id = ensureUuid("f_kentta") täsmäävät).
 */
export async function seedFromMock(): Promise<void> {
  if (!pool) return;

  const existing = await pool.query<{ count: string }>(
    "SELECT count(*)::text AS count FROM organizations",
  );
  if (Number(existing.rows[0]?.count ?? "0") > 0) return;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // organizations + members
    for (const m of MOCK_MEMBERSHIPS) {
      const org = m.organization;
      const orgUuid = ensureUuid(org.id);
      await client.query(
        `INSERT INTO organizations (id, name, slug, logo_url)
         VALUES ($1::uuid, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
        [orgUuid, org.name, org.slug, org.logoUrl ?? null],
      );
      await client.query(
        `INSERT INTO organization_members (org_id, user_id, role)
         VALUES ($1::uuid, $2, $3)
         ON CONFLICT (org_id, user_id) DO NOTHING`,
        [orgUuid, DEMO_USER_ID, m.role],
      );
    }

    // Loput seedataan ensimmäiseen orgin (Savuks). Muut demo-orgit jäävät tyhjiksi.
    const savuksRawId = MOCK_MEMBERSHIPS[0]?.organization.id;
    if (!savuksRawId) {
      await client.query("COMMIT");
      return;
    }
    const savuksUuid = ensureUuid(savuksRawId);

    // brand_brains
    await client.query(
      `INSERT INTO brand_brains (
         org_id, writing_style, tone_of_voice, values, services, target_audiences, ctas
       ) VALUES ($1::uuid, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb)
       ON CONFLICT (org_id) DO NOTHING`,
      [
        savuksUuid,
        MOCK_BRAND_BRAIN.writingStyle,
        MOCK_BRAND_BRAIN.toneOfVoice,
        MOCK_BRAND_BRAIN.values,
        JSON.stringify(MOCK_BRAND_BRAIN.services),
        JSON.stringify(MOCK_BRAND_BRAIN.targetAudiences),
        JSON.stringify(MOCK_BRAND_BRAIN.ctas),
      ],
    );

    // content_series
    for (const s of MOCK_BRAND_BRAIN.allowedSeries) {
      await client.query(
        `INSERT INTO content_series (id, org_id, name, description, is_active)
         VALUES ($1::uuid, $2::uuid, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [ensureUuid(s.id), savuksUuid, s.name, s.description ?? null, s.isActive],
      );
    }

    // folders
    for (const f of MOCK_FOLDERS) {
      await client.query(
        `INSERT INTO folders (id, org_id, name, parent_id)
         VALUES ($1::uuid, $2::uuid, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
        [
          ensureUuid(f.id),
          savuksUuid,
          f.name,
          f.parentId ? ensureUuid(f.parentId) : null,
        ],
      );
    }

    // media_assets
    for (const a of MOCK_MEDIA) {
      await client.query(
        `INSERT INTO media_assets (
           id, org_id, kind, title, tags, folder_id, thumbnail_url,
           duration_seconds, analysis_status, analysis, created_at
         ) VALUES (
           $1::uuid, $2::uuid, $3, $4, $5::jsonb, $6::uuid, $7, $8, $9, $10::jsonb, $11
         ) ON CONFLICT (id) DO NOTHING`,
        [
          ensureUuid(a.id),
          savuksUuid,
          a.kind,
          a.title,
          JSON.stringify(a.tags),
          a.folderId ? ensureUuid(a.folderId) : null,
          a.thumbnailUrl,
          a.durationSeconds ?? null,
          a.analysisStatus,
          a.analysis ? JSON.stringify(a.analysis) : null,
          a.createdAt,
        ],
      );
    }

    // content_items
    for (const c of MOCK_CONTENT_QUEUE) {
      await client.query(
        `INSERT INTO content_items (
           id, org_id, title, status, media_asset_id, series_name, channels, created_at
         ) VALUES (
           $1::uuid, $2::uuid, $3, $4, $5::uuid, $6, $7::jsonb, $8
         ) ON CONFLICT (id) DO NOTHING`,
        [
          ensureUuid(c.id),
          savuksUuid,
          c.title,
          c.status,
          c.mediaAssetId ? ensureUuid(c.mediaAssetId) : null,
          c.seriesName ?? null,
          JSON.stringify(c.channels),
          c.createdAt,
        ],
      );
    }

    // calendar_events
    for (const e of MOCK_CALENDAR) {
      await client.query(
        `INSERT INTO calendar_events (
           id, org_id, title, channel, status, scheduled_at, thumbnail_url
         ) VALUES (
           $1::uuid, $2::uuid, $3, $4, $5, $6, $7
         ) ON CONFLICT (id) DO NOTHING`,
        [
          ensureUuid(e.id),
          savuksUuid,
          e.title,
          e.channel,
          e.status,
          e.scheduledAt,
          e.thumbnailUrl ?? null,
        ],
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Vaihe 16 (v3): seed demo-analytiikkaa aktiiviorgille jos analytics_metrics
 * on tyhjä sille orgille. Idempotentti — palautuu heti jos rivejä on jo.
 * Julkaisu-integraatiota ei ole vielä, joten oikeaa dataa ei muuten synny;
 * seed pitää tuotannon Analytics-näkymän uskottavan näköisenä.
 */
export async function seedAnalytics(): Promise<void> {
  if (!pool) return;
  const savuksRawId = MOCK_MEMBERSHIPS[0]?.organization.id;
  if (!savuksRawId) return;
  const savuksUuid = ensureUuid(savuksRawId);

  const existing = await pool.query<{ count: string }>(
    "SELECT count(*)::text AS count FROM analytics_metrics WHERE org_id = $1::uuid",
    [savuksUuid],
  );
  if (Number(existing.rows[0]?.count ?? "0") > 0) return;

  const TOPICS = [
    "Sammutinhuolto",
    "Palovaroittimet",
    "VSS-tarkastukset",
    "Sprinklerihuolto",
    "Näin se tehdään",
    "Löydätkö virheen",
  ];
  const CHANNELS = ["tiktok", "instagram", "facebook", "linkedin", "blog"] as const;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const today = new Date();
    for (let dayAgo = 0; dayAgo < 30; dayAgo++) {
      const date = new Date(today);
      date.setDate(today.getDate() - dayAgo);
      const dateStr = date.toISOString().slice(0, 10);
      for (const topic of TOPICS) {
        for (const channel of CHANNELS) {
          // Skippaa ~60 % osumia jotta data näyttää harvempsalta ja aidommalta
          if (Math.random() < 0.6) continue;
          const views = 100 + Math.floor(Math.random() * 700);
          const engagementRatio = 0.05 + Math.random() * 0.05;
          const engagement = Math.max(1, Math.floor(views * engagementRatio));
          const watchTime = 12 + Math.random() * 13;
          await client.query(
            `INSERT INTO analytics_metrics
               (org_id, channel, metric_date, views, engagement, watch_time_seconds, topic)
             VALUES ($1::uuid, $2, $3::date, $4, $5, $6, $7)`,
            [savuksUuid, channel, dateStr, views, engagement, watchTime.toFixed(2), topic],
          );
        }
      }
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Vaihe 19: bootstrap-admin. Jos ADMIN_EMAIL + ADMIN_PASSWORD on asetettu ja
 * käyttäjää ei vielä ole, luodaan users-rivi (hashattu salasana) ja liitetään
 * aktiivi-orgiin (Savuks demossa) adminina. Idempotentti — olemassa oleva
 * käyttäjä säilyy koskemattomana (salasanaa ei koskaan ylikirjoiteta).
 * Kutsutaan seedFromMockin jälkeen (organisaatiot on jo olemassa).
 */
export async function seedBootstrapAdmin(): Promise<void> {
  if (!pool) return;
  const emailRaw = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!emailRaw || !password) return;
  const email = emailRaw.trim().toLowerCase();
  if (!email) return;

  const existing = await pool.query<{ id: string }>(
    "SELECT id FROM users WHERE email = $1",
    [email],
  );
  if (existing.rows.length > 0) return; // ei ylikirjoiteta

  const savuksRawId = MOCK_MEMBERSHIPS[0]?.organization.id;
  if (!savuksRawId) return;
  const savuksUuid = ensureUuid(savuksRawId);
  const hash = await hashPassword(password);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const ins = await client.query<{ id: string }>(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [email, hash, "Admin"],
    );
    // Jos INSERT jäi ON CONFLICTiin (harvinainen race), hae olemassa olevan id.
    let userId = ins.rows[0]?.id;
    if (!userId) {
      const row = await client.query<{ id: string }>(
        "SELECT id FROM users WHERE email = $1",
        [email],
      );
      userId = row.rows[0]?.id;
    }
    if (userId) {
      await client.query(
        `INSERT INTO organization_members (org_id, user_id, role)
         VALUES ($1::uuid, $2, 'admin')
         ON CONFLICT (org_id, user_id) DO NOTHING`,
        [savuksUuid, userId],
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Mock-data käyttää lyhyitä id-merkkijonoja kuten "org_savuks", "m1", "s1",
 * "f_kentta". Postgres-taulut vaativat UUID:t (gen_random_uuid() defaultit).
 * Muunnetaan lyhyet id:t deterministiseksi UUIDv5-tyyliseksi merkkijonoksi
 * jotta viittaukset (folder_id, media_asset_id, org_id) säilyvät ehjinä.
 *
 * Sama syöte tuottaa aina saman uuid:n → jos folder.id = ensureUuid("f_kentta")
 * ja media.folder_id = ensureUuid("f_kentta"), ne täsmäävät.
 *
 * Jos syöte on jo validi uuid, palautetaan se sellaisenaan (esim. DEMO_USER_ID
 * ei muutu).
 */
function ensureUuid(id: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  // Deterministinen: hashaa id → 32 hex-merkkiä → UUID-formaatti (8-4-4-4-12)
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < id.length; i++) {
    const ch = id.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h2 = Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  const hex = (n: number) => (n >>> 0).toString(16).padStart(8, "0");
  const raw = hex(h1) + hex(h2) + hex(h1 ^ h2) + hex(h2 + h1);
  return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-4${raw.slice(13, 16)}-8${raw.slice(17, 20)}-${raw.slice(20, 32)}`;
}
