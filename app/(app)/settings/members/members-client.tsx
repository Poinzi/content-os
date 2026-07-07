"use client";

import { useMemo, useState } from "react";
import { Copy, Check, UserPlus, X } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { OrgRole } from "@/lib/types";
import type { MemberRow, PendingInvite } from "@/lib/data";

interface Props {
  currentUserId: string;
  initialMembers: MemberRow[];
  initialInvites: PendingInvite[];
}

const ROLE_FI: Record<OrgRole, string> = {
  owner: "Omistaja",
  admin: "Ylläpitäjä",
  editor: "Käyttäjä",
  reviewer: "Tarkastaja",
  viewer: "Katselija",
};

export function MembersClient({
  currentUserId,
  initialMembers,
  initialInvites,
}: Props) {
  const [members, setMembers] = useState<MemberRow[]>(initialMembers);
  const [invites, setInvites] = useState<PendingInvite[]>(initialInvites);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("editor");
  const [lastLink, setLastLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const adminCount = useMemo(
    () => members.filter((m) => m.role === "admin" || m.role === "owner").length,
    [members],
  );

  const submitInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setLastLink(null);
    setBusy(true);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = (await res.json().catch(() => null)) as
        | { token?: string; error?: string; ok?: boolean }
        | null;
      if (!res.ok || !data?.token) {
        setInviteError(data?.error ?? "Kutsun luonti epäonnistui");
        return;
      }
      const link = `${window.location.origin}/join/${data.token}`;
      setLastLink(link);
      setInvites((cur) => [
        {
          id: `pending-${data.token}`,
          email: email.trim().toLowerCase(),
          role,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        ...cur,
      ]);
      setEmail("");
    } catch {
      setInviteError("Verkkovirhe — yritä uudelleen");
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    if (!lastLink) return;
    try {
      await navigator.clipboard.writeText(lastLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // ohitetaan hiljaisesti
    }
  };

  const revoke = async (inviteId: string) => {
    const before = invites;
    setInvites((cur) => cur.filter((i) => i.id !== inviteId));
    try {
      const res = await fetch(`/api/invites/${encodeURIComponent(inviteId)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
    } catch {
      setInvites(before);
    }
  };

  const removeMember = async (userId: string) => {
    if (!confirm("Poistetaanko käyttäjä organisaatiosta?")) return;
    const before = members;
    setMembers((cur) => cur.filter((m) => m.id !== userId));
    try {
      const res = await fetch(`/api/members/${encodeURIComponent(userId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setMembers(before);
        alert(data?.error ?? "Poisto epäonnistui");
      }
    } catch {
      setMembers(before);
      alert("Verkkovirhe");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Kutsu-lomake */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-text-primary">
              Kutsu uusi käyttäjä
            </h2>
          </div>
          <form onSubmit={submitInvite} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="uusi.kayttaja@example.com"
              className="w-full rounded-md border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-strong focus:outline-none"
              required
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as OrgRole)}
              className="w-full rounded-md border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary focus:border-border-strong focus:outline-none"
            >
              <option value="editor">Käyttäjä</option>
              <option value="admin">Ylläpitäjä</option>
            </select>
            {inviteError ? (
              <p className="text-xs text-status-warning">{inviteError}</p>
            ) : null}
            <Button
              type="submit"
              size="sm"
              className="w-full"
              disabled={busy || !email}
            >
              {busy ? "Luodaan…" : "Luo kutsulinkki"}
            </Button>
          </form>

          {lastLink ? (
            <div className="rounded-md border border-border-subtle bg-bg-surface-2 p-3">
              <p className="mb-2 text-xs text-text-secondary">
                Kopioi linkki ja lähetä se kutsutulle:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={lastLink}
                  className="flex-1 rounded-md border border-border-subtle bg-bg-base px-2 py-1.5 text-xs text-text-primary"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex items-center gap-1 rounded-md border border-border-subtle bg-bg-surface px-2 py-1.5 text-xs text-text-secondary hover:border-border-strong hover:text-text-primary"
                  title="Kopioi linkki"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Kopioitu
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Kopioi
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : null}
        </CardBody>
      </Card>

      {/* Jäsenlista */}
      <Card>
        <CardBody className="space-y-3">
          <h2 className="text-sm font-semibold text-text-primary">
            Nykyiset jäsenet ({members.length})
          </h2>
          <div className="space-y-2">
            {members.map((m) => {
              const isSelf = m.id === currentUserId;
              const isLastAdmin =
                (m.role === "admin" || m.role === "owner") && adminCount <= 1;
              const canRemove = !isSelf && !isLastAdmin;
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border-subtle bg-bg-surface p-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-text-primary">
                      {m.name || m.email}
                    </p>
                    <p className="truncate text-xs text-text-tertiary">
                      {m.email} · {ROLE_FI[m.role] ?? m.role}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMember(m.id)}
                    disabled={!canRemove}
                    className="shrink-0 rounded-md border border-border-subtle bg-bg-surface-2 px-2 py-1 text-xs text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    title={
                      isSelf
                        ? "Et voi poistaa itseäsi"
                        : isLastAdmin
                          ? "Viimeistä ylläpitäjää ei voi poistaa"
                          : "Poista jäsen"
                    }
                  >
                    Poista
                  </button>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Avoimet kutsut */}
      {invites.length > 0 ? (
        <Card className="lg:col-span-2">
          <CardBody className="space-y-3">
            <h2 className="text-sm font-semibold text-text-primary">
              Avoimet kutsut ({invites.length})
            </h2>
            <div className="space-y-2">
              {invites.map((i) => (
                <div
                  key={i.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border-subtle bg-bg-surface p-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-text-primary">
                      {i.email}
                    </p>
                    <p className="truncate text-xs text-text-tertiary">
                      {ROLE_FI[i.role] ?? i.role} · vanhenee{" "}
                      {new Date(i.expiresAt).toLocaleDateString("fi-FI")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => revoke(i.id)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border-subtle bg-bg-surface-2 px-2 py-1 text-xs text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
                    title="Peru kutsu"
                  >
                    <X className="h-3 w-3" />
                    Peru
                  </button>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
