"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { ComingSoon } from "@/components/ui/skeleton";

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
        const content = (
          <>
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-sm">{item.label}</span>
            {item.soon ? <ComingSoon version={item.soon} /> : null}
          </>
        );
        const base =
          "group flex items-center gap-3 rounded-md px-3 py-2 transition-colors";
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              base,
              active
                ? "bg-gradient-to-r from-accent-from/20 to-accent-to/10 text-text-primary"
                : "text-text-secondary hover:bg-bg-surface-2 hover:text-text-primary",
            )}
            aria-current={active ? "page" : undefined}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
