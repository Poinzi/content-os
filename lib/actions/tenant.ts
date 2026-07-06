"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ACTIVE_ORG_COOKIE } from "@/lib/tenant";

export async function switchTenant(orgId: string) {
  const jar = await cookies();
  jar.set(ACTIVE_ORG_COOKIE, orgId, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/");
}
