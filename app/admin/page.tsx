import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin-auth";
import { isAccountLoginConfigured } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Keep the existing /admin link and owner login, but retire the redundant
  // preview dashboard. All content desks now return to Owner Tools.
  if (await isAdminAuthenticated()) redirect("/account/owner-tools");

  return (
    <main className="admin-shell admin-sign-in">
      <section className="admin-auth-card" aria-labelledby="admin-title">
        <div className="admin-auth-head">
          <Image src="/assets/logos/podscape-wordmark.svg" alt="PodScape Labs" width={232} height={38} priority />
          <ThemeToggle />
        </div>
        <p className="eyebrow">Private owner access</p>
        <h1 id="admin-title">Owner Tools</h1>
        <p className="admin-intro">Sign in to manage your PodScape content desks and tester access.</p>
        <AdminLoginForm configured={isAdminConfigured()} accountLogin={isAccountLoginConfigured()} />
        <Link className="admin-back-link" href="/app">← Return to PodScape</Link>
      </section>
    </main>
  );
}
