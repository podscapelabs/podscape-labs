import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerAccountForm } from "@/components/CustomerAccountForm";
import { speciesDisplayName, speciesScientificName } from "@/data/species";
import { signOutCustomer } from "./actions";
import { customerSupabase } from "@/lib/customer-auth/server";
import { listEnclosures } from "@/lib/keeper";
import { getMemberCollectionEntries } from "@/lib/member-collection";
import { getSpeciesRecords } from "@/lib/species-store";
import styles from "./customer-auth.module.css";

export default async function CustomerAccountPage({ searchParams }: { searchParams: Promise<{ verified?: string }> }) {
  const db = await customerSupabase();
  if (!db) redirect("/account/login");
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/account/login");

  const [{ data: profile }, collectionEntries, enclosures, records] = await Promise.all([
    db.from("customer_profiles").select("display_name,created_at").eq("id", user.id).maybeSingle(),
    getMemberCollectionEntries(db, user.id),
    listEnclosures(),
    getSpeciesRecords(),
  ]);
  const { verified } = await searchParams;
  const displayName = profile?.display_name || "Keeper";
  const activeEnclosures = enclosures.filter((enclosure) => !enclosure.isArchived);
  const speciesById = new Map(records.map((record) => [record.id, record]));
  const totalQuantity = activeEnclosures.reduce((total, enclosure) => total + enclosure.quantity, 0);
  const attentionCount = activeEnclosures.filter((enclosure) => enclosure.status === "declining").length;
  const groups = collectionEntries.map((entry) => {
    const record = speciesById.get(entry.speciesId);
    const speciesEnclosures = activeEnclosures.filter((enclosure) => enclosure.speciesId === entry.speciesId);
    return { record, enclosures: speciesEnclosures, total: speciesEnclosures.reduce((sum, enclosure) => sum + enclosure.quantity, 0) };
  }).filter((group) => group.record);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <p className={styles.eyebrow}>Podscape Labs · Your account</p>
        <div className={styles.accountHeading}>
          <div><h1>Welcome, {displayName}.</h1><p>Your member details and future keeper tools live here.</p></div>
          <form action={signOutCustomer}><button className={styles.outlineButton} type="submit">Sign out</button></form>
        </div>
        {verified === "1" ? <p className={styles.success} role="status">Email confirmed. Welcome to Podscape.</p> : null}
        <section className={styles.keeperDashboard} aria-labelledby="keeper-dashboard-title">
          <div className={styles.sectionHeading}><div><p className={styles.panelLabel}>Keeper dashboard · Private</p><h2 id="keeper-dashboard-title">Manage your colonies.</h2><p className={styles.secondary}>Each saved species can hold several separate colonies or enclosures.</p></div><Link className={styles.outlineButton} href="/ledger">+ Add a species</Link></div>
          <div className={styles.keeperStats}>
            <div><span>Species</span><strong>{groups.length}</strong></div>
            <div><span>Active enclosures</span><strong>{activeEnclosures.length}</strong></div>
            <div><span>Total animals</span><strong>{totalQuantity}</strong></div>
            <div><span>Need attention</span><strong>{attentionCount}</strong></div>
          </div>
          {groups.length === 0 ? <div className={styles.emptyDashboard}><h3>Your keeper dashboard starts in Leaf Ledger.</h3><p>Save a species to create its first private enclosure record.</p><Link className={styles.textLink} href="/ledger">Browse Leaf Ledger →</Link></div> : <div className={styles.speciesManagerGrid}>{groups.map(({ record, enclosures: speciesEnclosures, total }) => record ? <article className={styles.speciesManagerCard} key={record.id}>
            <div><p>{speciesEnclosures.length} active {speciesEnclosures.length === 1 ? "enclosure" : "enclosures"}</p><h3>{speciesDisplayName(record)}</h3><em>{speciesScientificName(record)}</em></div>
            <div className={styles.speciesCardSummary}><span><b>{total}</b> kept</span>{speciesEnclosures.slice(0, 2).map((enclosure) => <span key={enclosure.id}>{enclosure.name} · {enclosure.status.replaceAll("-", " ")}</span>)}</div>
            <Link href={speciesEnclosures[0] ? `/keeper/${speciesEnclosures[0].id}` : `/keeper?species=${encodeURIComponent(record.id)}`}>Manage species →</Link>
          </article> : null)}</div>}
        </section>
        <div className={styles.dashboardGrid}>
          <section className={styles.panel}>
            <p className={styles.panelLabel}>Member record · AC / 001</p>
            <h2>Account details</h2>
            <dl className={styles.facts}><div><dt>Email</dt><dd>{user.email}</dd></div><div><dt>Member since</dt><dd>{new Date(user.created_at).toLocaleDateString("en-CA", { month: "long", year: "numeric" })}</dd></div></dl>
            <h3>Display name</h3>
            <CustomerAccountForm kind="profile" initialName={profile?.display_name || ""} /><div className={styles.securitySection}><h3>Account security</h3><p className={styles.secondary}>Manage your sign-in details securely.</p><div className={styles.securityActions}><Link className={styles.textLink} href="/account/change-password">Change password →</Link><Link className={styles.textLink} href="/account/forgot-password">Forgot password?</Link></div></div>
          </section>
          <section className={styles.panel}>
            <p className={styles.panelLabel}>Leaf Ledger · Personal archive</p>
            <h2>My Collection</h2>
            <p className={styles.secondary}>{groups.length === 0 ? "You haven't saved any species yet. Browse Leaf Ledger and add the ones you keep." : `You have ${groups.length} species ${groups.length === 1 ? "entry" : "entries"} in your collection.`}</p>
            <Link className={styles.textLink} href="/ledger/my-collection">Open My Collection →</Link>
            <p><Link className={styles.textLink} href="/ledger">Explore the Leaf Ledger →</Link></p>
          </section>
        </div>
      </div>
    </div>
  );
}
