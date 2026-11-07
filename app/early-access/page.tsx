import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { customerSupabase } from "@/lib/customer-auth/server";
import { isApprovedTesterEmail } from "@/lib/customer-auth/access";
import { signOutCustomer } from "@/app/account/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Early Access | PodScape Labs", robots: { index: false, follow: false } };

export default async function EarlyAccessPage() {
  if (await isAdminAuthenticated()) redirect("/app");
  const db = await customerSupabase();
  const { data: { user } } = db ? await db.auth.getUser() : { data: { user: null } };
  if (user?.email && user.email_confirmed_at && await isApprovedTesterEmail(user.email)) redirect("/app");
  return <main className="admin-shell" style={{display:"grid",placeItems:"center",minHeight:"90svh"}}>
    <section className="admin-auth-card">
      <p className="eyebrow">PodScape Labs · Invitation only</p>
      <h1>Welcome to Early Access.</h1>
      <p className="admin-intro">We&apos;re inviting a few friends to test PodScape before launch. Use your approved email to create an account and explore.</p>
      {user ? <p>Your signed-in email is not currently approved for testing. Sign out to use a different invited email.</p> : <p>Have an invitation? Sign in or create your tester account.</p>}
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:20}}>
        {user ? <form action={signOutCustomer}><button type="submit" className="button button-primary">Sign out / switch account</button></form> : <>
          <a className="button button-primary" href="/account/login">Tester sign in</a>
          <a className="button button-outline" href="/account/sign-up">Create account</a>
        </>}
      </div>
      <p className="admin-intro">Tester accounts cannot edit studio content or enter Owner Studio.</p>
      <Link className="admin-back-link" href="/">← Public homepage</Link>
    </section>
  </main>;
}
