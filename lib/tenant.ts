import { cookies } from "next/headers";
import {
  getMemberships,
  getMembershipsForUser,
  getOrganizationById,
} from "@/lib/data";
import { authEnabled, SESSION_COOKIE, verifySession } from "@/lib/auth";
import { hasRole } from "@/lib/types";
import type { AuthUser, Membership, Organization, OrgRole } from "@/lib/types";

export const ACTIVE_ORG_COOKIE = "content-os-active-org";

export interface TenantContext {
  org: Organization;
  role: OrgRole;
  memberships: Membership[];
  user: AuthUser;
}

/**
 * Vaihe 19: tenant-konteksti.
 * - Demo-tila (auth OFF): palauta ensimmäinen mock-membership admin-roolissa
 *   ja "demo"-käyttäjä. Layout jatkaa toimintaansa kuten ennen.
 * - Auth ON: lue SESSION_COOKIE, verifioi HMAC:lla, hae org + memberships
 *   tietokannasta. Middleware on jo estänyt ilman istuntoa tänne pääsyn, mutta
 *   käsitellään null-tapaus (palauta null) turvallisuuden vuoksi.
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  const jar = await cookies();

  if (!authEnabled()) {
    const memberships = await getMemberships();
    if (memberships.length === 0) return null;
    const orgId = jar.get(ACTIVE_ORG_COOKIE)?.value;
    const match = orgId
      ? memberships.find((m) => m.organization.id === orgId)
      : undefined;
    const active = match ?? memberships[0];
    const user: AuthUser = {
      id: "demo",
      email: process.env.ADMIN_EMAIL ?? "demo@local",
      name: "Demo",
      role: "admin",
    };
    return {
      org: active.organization,
      role: active.role,
      memberships,
      user,
    };
  }

  const token = jar.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  if (!session) return null;

  const [org, memberships] = await Promise.all([
    getOrganizationById(session.oid),
    getMembershipsForUser(session.uid),
  ]);
  if (!org) return null;

  const role = (session.role as OrgRole) ?? "editor";
  const user: AuthUser = {
    id: session.uid,
    email: "",
    name: null,
    role,
  };
  return { org, role, memberships, user };
}

/**
 * Vaihe 20: käyttöoikeus admin-toimintoihin. Heittää "forbidden" jos ei ole
 * kirjautuneena tai rooli < admin. API-routet kääntävät heiton 403:ksi.
 */
export async function requireAdmin(): Promise<TenantContext> {
  const ctx = await getTenantContext();
  if (!ctx) throw new Error("unauthorized");
  if (!hasRole(ctx.role, "admin")) throw new Error("forbidden");
  return ctx;
}
