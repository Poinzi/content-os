import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string | Date) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("fi-FI", { day: "numeric", month: "long", year: "numeric" });
}

export function formatDateTime(iso: string | Date) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString("fi-FI", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/**
 * 12500 → "12,5 t", 1500 → "1,5 t", 950 → "950", 1_500_000 → "1,5 M".
 */
export function formatCompact(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) {
    const v = n / 1_000_000;
    return v.toLocaleString("fi-FI", { maximumFractionDigits: 1 }) + " M";
  }
  if (abs >= 1_000) {
    const v = n / 1_000;
    return v.toLocaleString("fi-FI", { maximumFractionDigits: 1 }) + " t";
  }
  return n.toLocaleString("fi-FI");
}
