import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { customerSupabase } from "@/lib/customer-auth/server";
import { signOutAdmin } from "@/app/admin/actions";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Owner Tools | Podscape Labs", robots: { index: false, follow: false } };

const desks = [
  { title: "Species Desk", label: "Leaf Ledger", description: "Manage species records, images and husbandry information.", href: "/admin/species", symbol: "❧" },
  { title: "Product Desk", label: "Shop", description: "Prepare listings, photography, pricing and publication.", href: "/admin/products", symbol: "▣" },
  { title: "Guide Desk", label: "Field Guide", description: "Write, refine and publish educational articles.", href: "/admin/guides", symbol: "▤" },
  { title: "Lab Desk", label: "From the Lab", description: "Share project updates and studio notes.", href: "/admin/lab", symbol: "✧" },
  { title: "PodBound Card Desk", label: "PodBound", description: "Manage game cards, Ola's artwork and card publication.", href: "/admin/podbound", symbol: "✦" },
];

export default async function OwnerToolsPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const db = await customerSupabase();
  const { data: { user } } = db ? await db.auth.getUser() : { data: { user: null } };
  return <main className={styles.page}>
    <div className={styles.inner}>
      <header className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>PODSCAPE LABS / OWNER ACCESS</p>
          <h1>Owner Tools</h1>
          <p>One place to manage the things you&apos;re building.</p>
        </div>
        <Link className={styles.back} href={user ? "/account" : "/app"}>← {user ? "My Podscape" : "Podscape Home"}</Link>
      </header>
      <section aria-labelledby="content-heading">
        <div className={styles.sectionHeading}><p className={styles.eyebrow}>CONTENT MANAGEMENT</p><h2 id="content-heading">Your desks</h2></div>
        <div className={styles.grid}>
          {desks.map(desk => <Link className={styles.card} href={desk.href} key={desk.href}>
            <span className={styles.symbol} aria-hidden="true">{desk.symbol}</span>
            <span className={styles.copy}><small>{desk.label}</small><strong>{desk.title}</strong><span>{desk.description}</span></span>
            <span className={styles.arrow} aria-hidden="true">↗</span>
          </Link>)}
        </div>
      </section>
      <section className={styles.other} aria-labelledby="more-heading">
        <div className={styles.sectionHeading}><p className={styles.eyebrow}>OPERATIONS</p><h2 id="more-heading">Manage access &amp; settings</h2></div>
        <div className={styles.links}>
          <Link href="/admin/early-access"><span><strong>Early Access</strong><small>Approve testers and manage invitations.</small></span><b aria-hidden="true">→</b></Link>
          <Link href="/keeper"><span><strong>Manager</strong><small>Open your colony management dashboard.</small></span><b aria-hidden="true">→</b></Link>
          <Link href="/admin/reset-password"><span><strong>Owner security</strong><small>Update your owner password.</small></span><b aria-hidden="true">→</b></Link>
        </div>
      </section>
      <form action={signOutAdmin} className={styles.signOut}><button type="submit">Sign out of owner access</button></form>
    </div>
  </main>;
}
