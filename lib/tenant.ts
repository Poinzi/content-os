import { cookies } from "next/headers";
import { getMemberships } from "@/lib/data";
import type { Membership, Organization, OrgRole } from "@/lib/types";

export const ACTIVE_ORG_COOKIE = "content-os-active-org";

export interface TenantContext {
  org: Organization;
  role: OrgRole;
  memberships: Membership[];
}

export async function getTenantContext(): Promise<TenantContext | null> {
  const memberships = await getMemberships();
  if (memberships.length === 0) return null;
  const jar = await cookies();
  const orgId = jar.get(ACTIVE_ORG_COOKIE)?.value;
  const match = orgId
    ? memberships.find((m) => m.organization.id === orgId)
    : undefined;
  const active = match ?? memberships[0];
  return { org: active.organization, role: active.role, memberships };
}
