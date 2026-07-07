"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import { hasRole } from "@/lib/types";
import type { OrgRole } from "@/lib/types";
import { cn } from "@/lib/utils";

type Command = {
  id: string;
  label: string;
  hint?: string;
  action: () => void;
  disabled?: boolean;
};

export function CommandPalette({ role = "admin" }: { role?: OrgRole } = {}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setHighlight(0);
    }
  }, [open]);

  const commands = useMemo<Command[]>(() => {
    const visible = NAV_ITEMS.filter(
      (n) => !n.adminOnly || hasRole(role, "admin"),
    );
    const navCmds: Command[] = visible.map((n) => ({
      id: `nav:${n.href}`,
      label: n.label,
      hint: n.soon ? `Tulossa ${n.soon}` : "Navigointi",
      disabled: !!n.soon,
      action: () => router.push(n.href),
    }));
    const extras: Command[] = [
      {
        id: "action:create",
        label: "Luo uusi sisältö",
        hint: "Sisältö",
        action: () => console.log("TODO: open create modal"),
      },
    ];
    return [...navCmds, ...extras];
  }, [router, role]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.trim().toLowerCase();
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  const run = useCallback(
    (cmd: Command) => {
      if (cmd.disabled) return;
      cmd.action();
      setOpen(false);
    },
    [],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-24 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-lg border border-border-subtle bg-bg-surface shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
          <Search className="h-4 w-4 text-text-tertiary" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlight(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlight((h) => Math.min(h + 1, filtered.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlight((h) => Math.max(h - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                const cmd = filtered[highlight];
                if (cmd) run(cmd);
              }
            }}
            placeholder="Etsi navigointeja ja toimintoja…"
            className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
          />
          <kbd className="rounded border border-border-subtle bg-bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-text-secondary">
            Esc
          </kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-text-tertiary">
              Ei osumia
            </li>
          ) : (
            filtered.map((cmd, i) => (
              <li key={cmd.id}>
                <button
                  type="button"
                  disabled={cmd.disabled}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => run(cmd)}
                  className={cn(
                    "flex w-full items-center justify-between px-4 py-2 text-left text-sm",
                    i === highlight
                      ? "bg-bg-surface-2 text-text-primary"
                      : "text-text-secondary",
                    cmd.disabled && "cursor-not-allowed opacity-50",
                  )}
                >
                  <span>{cmd.label}</span>
                  {cmd.hint ? (
                    <span className="text-[11px] text-text-tertiary">{cmd.hint}</span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
