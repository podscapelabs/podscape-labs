import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import Image from "next/image";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin-auth";
import { isAccountLoginConfigured } from "@/lib/supabase-auth";
import { OwnerDashboard } from "@/components/admin/OwnerDashboard";
import { getSpeciesRecords } from "@/lib/species-store";
import { getProductRecords } from "@/lib/product-store";
import { getGuideRecords } from "@/lib/guide-store";
import { getLabRecords } from "@/lib/lab-store";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return (
      <main className="admin-shell admin-sign-in">
        <section className="admin-auth-card" aria-labelledby="admin-title">
          <div className="admin-auth-head">
            <Image
              src="/assets/logos/podscape-wordmark.svg"
              alt="Podscape Labs"
              width={232}
              height={38}
              priority
            />
            <ThemeToggle />
          </div>
          <p className="eyebrow">Private owner access</p>
          <h1 id="admin-title">Enter the studio.</h1>
          <p className="admin-intro">
            The public site remains under construction. Sign in to review the complete working site.
          </p>
          <AdminLoginForm configured={isAdminConfigured()} accountLogin={isAccountLoginConfigured()} />
          <Link className="admin-back-link" href="/">← Return to public page</Link>
        </section>
      </main>
    );
  }

  const [species,products,guides,lab] = await Promise.all([getSpeciesRecords(),getProductRecords(),getGuideRecords(),getLabRecords()]);
  return <OwnerDashboard species={species} products={products} guides={guides} lab={lab}/>;
}
