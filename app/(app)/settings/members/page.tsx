import { getTenantContext } from "@/lib/tenant";
import { hasRole } from "@/lib/types";
import { listMembers, listPendingInvites } from "@/lib/data";
import { Card, CardBody } from "@/components/ui/card";
import { MembersClient } from "./members-client";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const ctx = await getTenantContext();
  if (!ctx) return null;

  if (!hasRole(ctx.role, "admin")) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-display text-text-primary">
          Jäsenhallinta
        </h1>
        <Card>
          <CardBody>
            <p className="text-sm text-text-secondary">
              Tämä näkymä on vain ylläpitäjille.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  const [members, invites] = await Promise.all([
    listMembers(ctx.org.id),
    listPendingInvites(ctx.org.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-display text-text-primary">
          Jäsenhallinta
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Kutsu uusia käyttäjiä ja hallitse rooleja organisaatiossa{" "}
          <span className="font-medium text-text-primary">{ctx.org.name}</span>.
        </p>
      </div>
      <MembersClient
        currentUserId={ctx.user.id}
        initialMembers={members}
        initialInvites={invites}
      />
    </div>
  );
}
