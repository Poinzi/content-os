"use client";

import { useState, useTransition } from "react";
import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import type { Membership } from "@/lib/types";
import { switchTenant } from "@/lib/actions/tenant";
import { cn } from "@/lib/utils";

interface Props {
  memberships: Membership[];
  activeOrgId: string;
}

const ROLE_LABEL: Record<Membership["role"], string> = {
  owner: "Omistaja",
  admin: "Ylläpitäjä",
  editor: "Toimittaja",
  reviewer: "Tarkistaja",
  viewer: "Katsoja",
};

export function TenantSwitcher({ memberships, activeOrgId }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const active = memberships.find((m) => m.organization.id === activeOrgId) ?? memberships[0];

  if (!active) return null;

  const handleSelect = (orgId: string) => {
    if (orgId === activeOrgId) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      await switchTenant(orgId);
      setOpen(false);
    });
  };

  return (
    <div className="relative px-3 pt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3 rounded-md border border-border-subtle bg-bg-surface-2 px-3 py-2 text-left transition-colors hover:border-border-strong",
          pending && "opacity-70",
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-accent-from to-accent-to text-white">
          <Building2 className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="truncate text-sm font-semibold text-text-primary">
            {active.organization.name}
          </div>
          <div className="text-[11px] text-text-tertiary">
            {ROLE_LABEL[active.role]}
          </div>
        </div>
        <ChevronsUpDown className="h-4 w-4 text-text-tertiary" />
      </button>

      {open ? (
        <div className="absolute inset-x-3 top-full z-30 mt-2 rounded-md border border-border-subtle bg-bg-surface shadow-pop">
          <ul className="max-h-64 overflow-y-auto p-1">
            {memberships.map((m) => {
              const active2 = m.organization.id === activeOrgId;
              return (
                <li key={m.organization.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(m.organization.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm text-text-secondary hover:bg-bg-surface-2 hover:text-text-primary",
                      active2 && "text-text-primary",
                    )}
                  >
                    <span className="flex-1 truncate">{m.organization.name}</span>
                    <span className="text-[11px] text-text-tertiary">
                      {ROLE_LABEL[m.role]}
                    </span>
                    {active2 ? <Check className="h-4 w-4 text-accent" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
