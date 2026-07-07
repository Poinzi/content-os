import { NextResponse } from "next/server";
import {
  completePublish,
  failPublish,
  getDueScheduled,
} from "@/lib/data";
import { getAdapter } from "@/lib/publishing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Vaihe 22: julkaisumoottori. Ajastin (Railway cron / GitHub Actions) POSTaa
 * tänne noin 5 min välein `x-cron-secret`-headerilla. Ilman CRON_SECRETiä
 * reitti on kiinni (401), ilman kelvollista headeria myös 401.
 *
 * Prosessi: hae erääntyneet ajastukset → kutsu adapteri per kanava → onnistuessa
 * merkitse published + kirjaa aloitusmetriikka, epäonnistuessa jätä scheduled-
 * tilaan (mahdollista uudelleenyritystä varten).
 *
 * Idempotenssi: `completePublish` päivittää vain jos rivi on yhä 'scheduled',
 * joten rinnakkaiset ajot eivät tuplajulkaise.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "cron disabled" },
      { status: 401 },
    );
  }
  const header = req.headers.get("x-cron-secret") ?? "";
  if (header !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const due = await getDueScheduled();
  let published = 0;
  const results: Array<{
    eventId: string;
    channel: string;
    ok: boolean;
    error?: string;
  }> = [];

  for (const job of due) {
    const adapter = getAdapter(job.channel);
    try {
      const r = await adapter.publish({
        channel: job.channel,
        text: buildPublishText(job.text, job.itemTitle),
        mediaUrl: job.mediaUrl,
        variantId: job.variantId,
        itemTitle: job.itemTitle,
      });
      if (r.ok) {
        const applied = await completePublish(job.eventId, job.variantId, {
          orgId: job.orgId,
          channel: job.channel,
          itemTitle: job.itemTitle,
        });
        if (applied) published++;
        results.push({
          eventId: job.eventId,
          channel: job.channel,
          ok: applied,
        });
      } else {
        await failPublish(job.eventId, r.error ?? "adapter failed");
        results.push({
          eventId: job.eventId,
          channel: job.channel,
          ok: false,
          error: r.error ?? "adapter failed",
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await failPublish(job.eventId, message);
      results.push({
        eventId: job.eventId,
        channel: job.channel,
        ok: false,
        error: message,
      });
      console.error(
        `[cron/publish-due] eventId=${job.eventId} channel=${job.channel} virhe:`,
        message,
      );
    }
  }

  return NextResponse.json({
    ok: true,
    due: due.length,
    published,
    results,
  });
}

/**
 * Yhdistä otsikko + varianttirunko yksinkertaisesti. Jos molemmat samat, käytä
 * vain runkoa. Adapterit voivat myöhemmin muotoilla omalla tavallaan.
 */
function buildPublishText(body: string, itemTitle: string | null): string {
  const cleanBody = (body ?? "").trim();
  if (!itemTitle) return cleanBody;
  const t = itemTitle.trim();
  if (!t || cleanBody.startsWith(t)) return cleanBody;
  return `${t}\n\n${cleanBody}`;
}
