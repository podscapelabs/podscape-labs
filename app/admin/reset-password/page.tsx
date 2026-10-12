import Image from "next/image";
import { redirect } from "next/navigation";
import { AdminPasswordUpdateForm } from "@/components/AdminPasswordResetForms";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getOwnerUser } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  if (!(await getOwnerUser())) redirect("/admin?error=invalid-reset");
  return <main className="admin-shell admin-sign-in"><section className="admin-auth-card" aria-labelledby="new-password-title">
    <div className="admin-auth-head"><Image src="/assets/logos/podscape-wordmark.svg" alt="Podscape Labs" width={232} height={38} priority /><ThemeToggle /></div>
    <p className="eyebrow">Secure owner access</p><h1 id="new-password-title">Choose a new password.</h1>
    <p className="admin-intro">Use at least 14 characters and avoid passwords used for any other account.</p>
    <AdminPasswordUpdateForm />
  </section></main>;
}
