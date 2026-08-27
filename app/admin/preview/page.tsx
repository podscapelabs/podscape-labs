import Link from "next/link";
import { redirect } from "next/navigation";
import { MarketingSite } from "@/components/MarketingSite";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminPreviewPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin");

  return (
    <div className="admin-preview-page">
      <div className="preview-owner-bar">
        <span>Private owner preview</span>
        <div><Link href="/admin/species">Open Ledger desk</Link><Link href="/admin">Return to studio</Link></div>
      </div>
      <MarketingSite />
    </div>
  );
}
