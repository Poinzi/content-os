import Link from "next/link";
import { Flame } from "lucide-react";
import { NavLinks } from "@/components/app-shell/nav-links";
import { TenantSwitcher } from "@/components/app-shell/tenant-switcher";
import type { Membership } from "@/lib/types";

interface Props {
  memberships: Membership[];
  activeOrgId: string;
}

export function Sidebar({ memberships, activeOrgId }: Props) {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 shrink-0 border-r border-border-subtle bg-bg-surface md:flex md:flex-col">
      <div className="flex items-center gap-2 px-5 pt-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-accent-from to-accent-to text-white">
          <Flame className="h-4 w-4" />
        </div>
        <Link
          href="/dashboard"
          className="text-sm font-semibold tracking-display text-text-primary"
        >
          Content OS
        </Link>
      </div>
      <TenantSwitcher memberships={memberships} activeOrgId={activeOrgId} />
      <NavLinks />
      <div className="border-t border-border-subtle px-5 py-3 text-[11px] text-text-tertiary">
        v0.1 · Vaihe 1
      </div>
    </aside>
  );
}
