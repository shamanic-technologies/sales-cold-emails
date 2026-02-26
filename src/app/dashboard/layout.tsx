import { cookies } from "next/headers";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ProvisionGuard } from "@/components/dashboard/provision-guard";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const hasApiKey = !!cookieStore.get("mcpf_api_key")?.value;
  const hasOrgId = !!cookieStore.get("mcpf_org_id")?.value;
  const isProvisioned = hasApiKey && hasOrgId;

  return (
    <DashboardShell>
      {isProvisioned ? children : <ProvisionGuard>{children}</ProvisionGuard>}
    </DashboardShell>
  );
}
