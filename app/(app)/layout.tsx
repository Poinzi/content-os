import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/tenant";
import { Sidebar } from "@/components/app-shell/sidebar";
import { Topbar } from "@/components/app-shell/topbar";
import { CommandPalette } from "@/components/app-shell/command-palette";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getTenantContext();
  if (!ctx) redirect("/login");

  return (
    <div className="min-h-screen bg-bg-base">
      <Sidebar memberships={ctx.memberships} activeOrgId={ctx.org.id} />
      <div className="md:pl-64">
        <Topbar userName={ctx.org.name} />
        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}
