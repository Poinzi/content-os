"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

interface Props {
  authEnabled: boolean;
}

export function LoginForm({ authEnabled }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        router.replace(next);
        router.refresh();
        return;
      }
      const data = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;
      setError(data?.error ?? "Kirjautuminen epäonnistui");
    } catch {
      setError("Verkkovirhe — yritä uudelleen");
    } finally {
      setBusy(false);
    }
  };

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

          {authEnabled ? (
            <>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-display text-text-primary">
                  Kirjaudu sisään
                </h1>
                <p className="text-sm text-text-secondary">
                  Syötä sähköposti ja salasana.
                </p>
              </div>
              <form onSubmit={submit} className="space-y-3">
                <input
                  type="email"
                  autoFocus
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sähköposti@example.com"
                  className="w-full rounded-md border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus:border-border-strong focus:outline-none"
                />
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Salasana"
                  className="w-full rounded-md border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus:border-border-strong focus:outline-none"
                />
                {error ? (
                  <p className="text-xs text-status-warning">{error}</p>
                ) : null}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={busy || email.length === 0 || password.length === 0}
                >
                  {busy ? "Kirjaudutaan…" : "Kirjaudu"}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-display text-text-primary">
                  Demo-tila
                </h1>
                <p className="text-sm text-text-secondary">
                  Kirjautuminen ei ole vielä konfiguroitu — jatka demona.
                </p>
              </div>
              <Link href={next} className="block">
                <Button className="w-full" size="lg">
                  Jatka
                </Button>
              </Link>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
