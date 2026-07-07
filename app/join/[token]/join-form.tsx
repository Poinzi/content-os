"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Props {
  token: string;
  email: string;
}

export function JoinForm({ token, email }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Salasanan on oltava vähintään 8 merkkiä");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, password }),
      });
      if (res.ok) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }
      const data = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;
      setError(data?.error ?? "Liittyminen epäonnistui");
    } catch {
      setError("Verkkovirhe — yritä uudelleen");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        type="email"
        value={email}
        readOnly
        aria-label="Sähköposti"
        className="w-full rounded-md border border-border-subtle bg-bg-surface-2 px-3 py-2 text-sm text-text-tertiary"
      />
      <input
        type="text"
        autoFocus
        autoComplete="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nimi (näytetään tiimille)"
        className="w-full rounded-md border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus:border-border-strong focus:outline-none"
      />
      <input
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Uusi salasana (vähintään 8 merkkiä)"
        className="w-full rounded-md border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus:border-border-strong focus:outline-none"
      />
      {error ? <p className="text-xs text-status-warning">{error}</p> : null}
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={busy || password.length < 8}
      >
        {busy ? "Liitytään…" : "Liity ja kirjaudu"}
      </Button>
    </form>
  );
}
