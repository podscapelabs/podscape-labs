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
        <div><Link href="/admin/species">Ledger desk</Link><Link href="/admin/guides">Guide desk</Link><Link href="/admin/lab">Lab desk</Link><Link href="/admin/products">Product desk</Link><Link href="/admin">Owner studio</Link></div>
      </div>
      <MarketingSite />
    </div>
  );
}
