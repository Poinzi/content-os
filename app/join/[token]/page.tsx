import Link from "next/link";
import { Flame } from "lucide-react";
import { getInviteByToken } from "@/lib/data";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JoinForm } from "./join-form";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface Props {
  params: Promise<{ token: string }>;
}

const ROLE_FI: Record<string, string> = {
  admin: "Ylläpitäjä",
  editor: "Käyttäjä",
  owner: "Omistaja",
  reviewer: "Tarkastaja",
  viewer: "Katselija",
};

export default async function JoinPage({ params }: Props) {
  const { token } = await params;
  const invite = await getInviteByToken(token);

  if (!invite || invite.expired || invite.accepted) {
    return <InvalidCard />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-sm">
        <CardBody className="space-y-6 py-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-accent-from to-accent-to text-white">
              <Flame className="h-4 w-4" />
            </div>
            <div className="text-sm font-semibold tracking-display text-text-primary">
              Content OS
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-display text-text-primary">
              Liity organisaatioon
            </h1>
            <p className="text-sm text-text-secondary">
              <span className="font-medium text-text-primary">
                {invite.organizationName}
              </span>
            </p>
            <p className="text-xs text-text-tertiary">
              Sähköposti: {invite.email} · Rooli: {ROLE_FI[invite.role] ?? invite.role}
            </p>
          </div>
          <JoinForm token={token} email={invite.email} />
        </CardBody>
      </Card>
    </div>
  );
}

function InvalidCard() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-sm">
        <CardBody className="space-y-6 py-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-accent-from to-accent-to text-white">
              <Flame className="h-4 w-4" />
            </div>
            <div className="text-sm font-semibold tracking-display text-text-primary">
              Content OS
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-display text-text-primary">
              Kutsu ei ole voimassa
            </h1>
            <p className="text-sm text-text-secondary">
              Linkki on vanhentunut, käytetty tai virheellinen. Pyydä
              ylläpitäjää lähettämään uusi kutsu.
            </p>
          </div>
          <Link href="/login" className="block">
            <Button className="w-full" size="lg">
              Kirjautumissivulle
            </Button>
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}
