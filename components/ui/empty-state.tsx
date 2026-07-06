import * as React from "react";
import { cn } from "@/lib/utils";

interface Props {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border-subtle bg-bg-surface/40 px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? <div className="text-text-tertiary">{icon}</div> : null}
      <h4 className="text-sm font-semibold text-text-primary">{title}</h4>
      {description ? (
        <p className="max-w-md text-xs text-text-secondary">{description}</p>
      ) : null}
      {action}
    </div>
  );
}
