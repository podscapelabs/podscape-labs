import Link from "next/link";
import { redirect } from "next/navigation";
import { MarketingSite } from "@/components/MarketingSite";
import styles from "@/components/MarketingHome.module.css";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const ownerLinks = [
  { label: "Manager dashboard", href: "/keeper" },
  { label: "Fun Zone", href: "/fun-zone" },
  { label: "Ledger desk", href: "/admin/species" },
  { label: "Guide desk", href: "/admin/guides" },
  { label: "Lab desk", href: "/admin/lab" },
  { label: "Product desk", href: "/admin/products" },
  { label: "Owner studio", href: "/admin" },
];

export default async function AdminPreviewPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  return <div className="admin-preview-page">
    <div className={`preview-owner-bar ${styles.ownerBar}`}>
      <span>Private owner preview</span>
      <div className={styles.ownerDesktopLinks}>
        {ownerLinks.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}
      </div>
      <details className={styles.ownerMobileMenu}>
        <summary>Owner tools</summary>
        <nav aria-label="Private owner tools">
          {ownerLinks.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}
        </nav>
      </details>
    </div>
    <MarketingSite />
  </div>;
}
