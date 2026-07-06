import { UserPlus, ShieldCheck } from "lucide-react";
import { getTenantContext } from "@/lib/tenant";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { hasRole, type OrgRole } from "@/lib/types";

const ROLE_LABEL: Record<OrgRole, string> = {
  owner: "Omistaja",
  admin: "Pääkäyttäjä",
  editor: "Sisällöntekijä",
  reviewer: "Hyväksyjä",
  viewer: "Katselija",
};

interface MockMember {
  email: string;
  role: OrgRole;
}

const MOCK_MEMBERS: MockMember[] = [
  { email: "jari@savuks.fi", role: "owner" },
  { email: "tiimi@savuks.fi", role: "editor" },
  { email: "tarkastaja@savuks.fi", role: "reviewer" },
];

export default async function SettingsPage() {
  const ctx = await getTenantContext();
  if (!ctx) return null;
  const canManage = hasRole(ctx.role, "admin");

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Asetukset"
        description={`${ctx.org.name} — organisaatio ja jäsenet`}
      />

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Organisaatio</CardTitle>
          </CardHeader>
          <CardBody className="space-y-1">
            <Row label="Nimi" value={ctx.org.name} />
            <Row label="Slug" value={ctx.org.slug} />
            <Row label="Oma rooli" value={ROLE_LABEL[ctx.role]} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jäsenet</CardTitle>
            {canManage ? (
              <Button size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Kutsu jäsen
              </Button>
            ) : null}
          </CardHeader>
          <CardBody>
            <ul className="divide-y divide-border-subtle">
              {MOCK_MEMBERS.map((m) => (
                <li
                  key={m.email}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-surface-2 text-xs font-semibold text-text-primary">
                    {m.email.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1 truncate text-sm text-text-primary">
                    {m.email}
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-md border border-border-subtle bg-bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-text-secondary">
                    <ShieldCheck className="h-3 w-3 text-accent" />
                    {ROLE_LABEL[m.role]}
                  </span>
                </li>
              ))}
            </ul>
            {!canManage ? (
              <p className="mt-4 text-xs text-text-tertiary">
                Vain pääkäyttäjä tai omistaja voi hallita jäseniä.
              </p>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border-subtle py-2 last:border-b-0">
      <span className="text-xs uppercase tracking-wider text-text-tertiary">
        {label}
      </span>
      <span className="text-sm text-text-primary">{value}</span>
    </div>
  );
}
