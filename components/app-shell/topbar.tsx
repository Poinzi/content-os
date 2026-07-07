"use client";

import { LogOut, Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function Topbar({
  userName,
  showLogout = false,
}: {
  userName: string;
  showLogout?: boolean;
}) {
  const router = useRouter();
  const openPalette = () => {
    window.dispatchEvent(new CustomEvent("open-command-palette"));
  };
  const logout = async () => {
    try {
      await fetch("/api/login", { method: "DELETE" });
    } catch {
      // Vaikka DELETE epäonnistuisi, ohjataan silti login-sivulle.
    }
    router.replace("/login");
    router.refresh();
  };
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border-subtle bg-bg-base/80 px-5 backdrop-blur">
      <button
        type="button"
        onClick={openPalette}
        className="flex flex-1 max-w-md items-center gap-2 rounded-md border border-border-subtle bg-bg-surface px-3 py-1.5 text-left text-sm text-text-tertiary transition-colors hover:border-border-strong"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1">Etsi tai suorita komento…</span>
        <kbd className="rounded border border-border-subtle bg-bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-text-secondary">
          ⌘K
        </kbd>
      </button>
      <div className="flex-1" />
      <Button size="sm" className="gap-2">
        <Sparkles className="h-4 w-4" />
        Luo sisältö
      </Button>
      {showLogout ? (
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-bg-surface px-2.5 py-1.5 text-xs text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
          title="Kirjaudu ulos"
        >
          <LogOut className="h-3.5 w-3.5" />
          Ulos
        </button>
      ) : null}
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-surface-2 text-[11px] font-semibold text-text-primary">
        {userName.slice(0, 2).toUpperCase()}
      </div>
    </header>
  );
}
