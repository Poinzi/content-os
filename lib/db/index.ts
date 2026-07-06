import { Pool } from "pg";
import fs from "node:fs/promises";
import path from "node:path";

const url = process.env.DATABASE_URL || "";
export const isEnabled = url.length > 0;

function shouldUseSsl(u: string) {
  return /railway\.app|amazonaws\.com/.test(u) || process.env.PGSSL === "1";
}

export const pool = isEnabled
  ? new Pool({
      connectionString: url,
      ssl: shouldUseSsl(url) ? { rejectUnauthorized: false } : undefined,
    })
  : null;

export async function query<T = unknown>(text: string, params: unknown[] = []) {
  if (!pool) throw new Error("DATABASE_URL puuttuu — data-kerros käyttää mockia");
  const res = await pool.query(text, params);
  return { rows: res.rows as T[], rowCount: res.rowCount ?? 0 };
}

export async function initSchema(): Promise<{ ok: boolean; reason?: string }> {
  if (!pool) return { ok: false, reason: "no DATABASE_URL" };
  try {
    const file = path.join(process.cwd(), "db", "schema.sql");
    const sql = await fs.readFile(file, "utf8");
    await pool.query(sql);
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: (err as Error).message };
  }
}
