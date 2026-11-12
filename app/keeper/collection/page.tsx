import type { Metadata } from "next";
import Link from "next/link";
import { PlatformShell } from "@/components/PlatformShell";
import { KeeperMobileNav } from "@/components/KeeperMobileNav";
import { ManagerColonies } from "@/components/ManagerColonies";
import { getMemberCollectionState } from "@/lib/member-collection";
import { listEnclosures } from "@/lib/keeper";
import { getSpeciesRecords } from "@/lib/species-store";
import { isSpeciesRecordActive } from "@/data/species";
import styles from "./page.module.css";
import {resolveCollectionView} from "@/lib/collection-views";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Colonies | PodScape Labs", robots: { index: false, follow: false } };

export default async function MyColoniesPage({searchParams}:{searchParams:Promise<{intent?:string;species?:string;view?:string}>}) {
  const member = await getMemberCollectionState();
  const options=await searchParams;
  const intent=options.intent==="notes"?"notes":undefined;
  let unavailable = false;
  let bins: Awaited<ReturnType<typeof listEnclosures>> = [];
  let records: Awaited<ReturnType<typeof getSpeciesRecords>> = [];
  if (member.signedIn) {
    try { [records, bins] = await Promise.all([getSpeciesRecords(), listEnclosures()]); }
    catch { unavailable = true; }
  }
  const view=resolveCollectionView(options.view,options.species,bins);
  const archivedView=view==="archived",savedView=view==="saved";
  const active = bins.filter(bin => archivedView?bin.isArchived:!bin.isArchived);
  const species = records.filter(record => record.kind === "species" && (isSpeciesRecordActive(record)||bins.some(bin=>bin.speciesId===record.id)));
  return <PlatformShell>
    <div className={styles.page}>
      <div className={styles.inner}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/keeper">← Manager Dashboard</Link></nav>
        <header className={styles.heading}>
          <p className={styles.eyebrow}>MANAGER · YOUR COLLECTION</p>
          <h1>{savedView?"Saved species":archivedView?"Archived bins":"My Colonies"}</h1>
          <p>{savedView?"Species saved for reference. Add a bin when you start keeping them.":archivedView?"Review or restore bins you have archived.":"Your active bins, grouped by species."}</p>
          <nav aria-label="Collection views"><Link href="/keeper/collection?view=active" aria-current={view==="active"?"page":undefined}>My Colonies</Link>{" · "}<Link href="/keeper/collection?view=saved" aria-current={savedView?"page":undefined}>Saved species</Link>{" · "}<Link href="/keeper/collection?view=archived" aria-current={archivedView?"page":undefined}>Archived bins</Link></nav>
        </header>
        {!member.signedIn ? <section className={styles.empty}><h2>Your colonies are private.</h2><p>Sign in to see and manage your records.</p><Link href="/account/login">Sign in →</Link></section>
          : unavailable ? <section className={styles.empty} role="alert"><h2>Colony records are unavailable.</h2><p>Try again when the Keeper database is available.</p></section>
          : <ManagerColonies key={(member.userId||"guest")+":"+view+":"+(options.species||"")} scope={member.userId||"guest"} explicitView={Boolean(options.view||options.species||intent)} records={species} bins={active} allBins={bins.map(({speciesId,isArchived})=>({speciesId,isArchived}))} collectedIds={member.ids} intent={intent} initialSpecies={options.species} archivedView={archivedView} savedView={savedView} />}
      </div>
    </div>
    {member.signedIn ? <KeeperMobileNav active="keeper"/> : null}
  </PlatformShell>;
}
