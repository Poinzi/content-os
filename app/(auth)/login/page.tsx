import Link from "next/link";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

export default function LoginPage() {
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
              Kirjaudu sisään
            </h1>
            <p className="text-sm text-text-secondary">
              Mock-tilassa voit jatkaa demokäyttäjänä ilman kirjautumista.
              Oikea auth tulee myöhemmässä vaiheessa.
            </p>
          </div>
          <Link href="/dashboard" className="block">
            <Button className="w-full" size="lg">
              Jatka demona
            </Button>
          </Link>
          <p className="text-[11px] text-text-tertiary">
            Vaihe 1 · Ilman kirjautumista · Mock-data
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
