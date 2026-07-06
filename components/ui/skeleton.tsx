import * as React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("skeleton rounded-sm", className)}
      {...props}
    />
  );
}

interface ComingSoonProps {
  version?: string;
  className?: string;
  label?: string;
}

export function ComingSoon({ version, label = "Tulossa", className }: ComingSoonProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-border-subtle bg-bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-text-tertiary",
        className,
      )}
    >
      {label}
      {version ? <span className="text-accent">{version}</span> : null}
    </span>
  );
}
