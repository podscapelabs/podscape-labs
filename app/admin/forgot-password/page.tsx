import Image from "next/image";
import { AdminPasswordResetRequestForm } from "@/components/AdminPasswordResetForms";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function ForgotPasswordPage() {
  return <main className="admin-shell admin-sign-in"><section className="admin-auth-card" aria-labelledby="reset-title">
    <div className="admin-auth-head"><Image src="/assets/logos/podscape-wordmark.svg" alt="Podscape Labs" width={232} height={38} priority /><ThemeToggle /></div>
    <p className="eyebrow">Secure owner access</p><h1 id="reset-title">Reset access.</h1>
    <p className="admin-intro">Enter the owner email address. Reset links expire and can only open an approved Podscape account.</p>
    <AdminPasswordResetRequestForm />
  </section></main>;
}
