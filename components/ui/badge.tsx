import * as React from "react";
import { cn } from "@/lib/utils";
import type { ContentStatus } from "@/lib/types";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-border-subtle bg-bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-text-secondary",
        className,
      )}
      {...props}
    />
  );
}

const STATUS_STYLE: Record<ContentStatus, { label: string; className: string }> = {
  draft: {
    label: "Luonnos",
    className: "bg-bg-surface-2 text-text-secondary border-border-subtle",
  },
  in_review: {
    label: "Arvioinnissa",
    className: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  },
  approved: {
    label: "Hyväksytty",
    className: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  },
  scheduled: {
    label: "Aikataulutettu",
    className: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30",
  },
  published: {
    label: "Julkaistu",
    className: "bg-violet-500/10 text-violet-300 border-violet-500/30",
  },
  archived: {
    label: "Arkistoitu",
    className: "bg-neutral-500/10 text-neutral-400 border-neutral-500/30",
  },
};

export function StatusPill({ status, className }: { status: ContentStatus; className?: string }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium",
        s.className,
        className,
      )}
    >
      {s.label}
    </span>
  );
}
