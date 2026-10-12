import Image from "next/image";
import Link from "next/link";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { signOutAdmin } from "@/app/admin/actions";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin-auth";
import { isAccountLoginConfigured } from "@/lib/supabase-auth";

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

  return (
    <main className="admin-shell admin-dashboard">
      <header className="admin-dashboard-head">
        <div>
          <p className="eyebrow">Podscape Labs</p>
          <h1>Owner studio</h1>
          <p>Review the private working site while visitors continue to see the construction page.</p>
        </div>
        <div className="admin-dashboard-actions">
          <ThemeToggle />
          <Link className="button button-outline" href="/admin/reset-password">
            Change password
          </Link>
          <form action={signOutAdmin}>
            <button className="button button-outline" type="submit">Sign out</button>
          </form>
        </div>
      </header>

      <section className="admin-preview-card" aria-labelledby="preview-title">
        <div className="admin-preview-head">
          <div>
            <p className="admin-kicker">Private preview</p>
            <h2 id="preview-title">Platform rebuild · Version B</h2>
          </div>
          <Link className="button button-primary" href="/admin/preview" target="_blank">
            Open full preview
          </Link>
        </div>
        <div className="admin-preview-window">
          <div className="admin-preview-browser-bar" aria-hidden="true">
            <span /><span /><span />
            <b>podscapelabs.com — private preview</b>
          </div>
          <iframe src="/admin/preview" title="Private preview of the Podscape Labs website" />
        </div>
      </section>
      <section className="admin-studio-tools" aria-labelledby="studio-tools-title">
        <div><p className="admin-kicker">Content systems</p><h2 id="studio-tools-title">Build the archive from the inside.</h2><p>Prepare identities, catalogue metadata, husbandry snapshots, and editorial notes before anything becomes public.</p></div>
        <div className="admin-tool-grid"><Link className="admin-tool-card" href="/admin/species"><span>Leaf Ledger · Phase 1</span><strong>Species records</strong><p>Edit photographs, identities, catalogue metadata, and husbandry snapshots.</p><b>Open Ledger desk →</b></Link><Link className="admin-tool-card" href="/admin/guides"><span>Field Guide · Phase 1</span><strong>Guide articles</strong><p>Write structured resources, connect related species, and control publication.</p><b>Open Editorial desk →</b></Link><Link className="admin-tool-card" href="/admin/lab"><span>From the Lab · Phase 1</span><strong>Studio notebook</strong><p>Publish project updates, research notes, and behind-the-scenes articles.</p><b>Open Notebook desk →</b></Link><Link className="admin-tool-card" href="/admin/products"><span>Shop · Foundation</span><strong>Product catalogue</strong><p>Add product photography, descriptions, pricing, and publication status before Shopify is connected.</p><b>Open Product desk →</b></Link></div>
      </section>
    </main>
  );
}
