import { redirect } from "next/navigation";
import { MarketingSite } from "@/components/MarketingSite";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminPreviewPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  return <MarketingSite />;
}
