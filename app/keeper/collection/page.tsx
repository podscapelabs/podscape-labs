import type { Metadata } from "next";
import {PodscapeLineIcon} from "@/components/PodscapeLineIcon";
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
          <p>{savedView?"Species saved for later, separate from your active enclosures.":archivedView?"Your preserved bins and care records.":"Find a bin, record care, or manage your collection."}</p>
          <nav className={styles.views} aria-label="Collection views"><Link href="/keeper/collection?view=active" aria-current={view==="active"?"page":undefined}>Active bins</Link><Link href="/keeper/collection?view=saved" aria-current={savedView?"page":undefined}>Saved species</Link><Link href="/keeper/collection?view=archived" aria-current={archivedView?"page":undefined}>Archived</Link></nav>
        </header>
        {member.signedIn&&!unavailable?<section className={styles.overview} aria-label="Collection overview and tools">
          <h2 className={styles.overviewLabel}>Collection snapshot</h2>
          <div className={styles.overviewStats}>
            <div><strong>{bins.filter(bin=>!bin.isArchived).length}</strong><span>Active bins</span></div>
            <div><strong>{member.ids.length}</strong><span>In collection</span></div>
            <div><strong>{bins.filter(bin=>bin.isArchived).length}</strong><span>Archived</span></div>
          </div>
          <div className={styles.primaryTools}>
            <Link href="/keeper/scan?manual=1"><PodscapeLineIcon name="droplet"/> Quick Care</Link>
            <Link href="/keeper/new"><PodscapeLineIcon name="bin"/> Add a bin</Link>
          </div>
          <details className={styles.moreTools}><summary>More collection tools <PodscapeLineIcon name="arrow-down"/></summary><nav aria-label="More collection tools">
            <Link href="/keeper/import"><PodscapeLineIcon name="note"/> Import spreadsheet</Link>
            <Link href="/ledger"><PodscapeLineIcon name="leaf"/> Discover species</Link>
          </nav></details>
        </section>:null}
        {!member.signedIn ? <section className={styles.empty}><h2>Your colonies are private.</h2><p>Sign in to see and manage your records.</p><Link href="/account/login">Sign in →</Link></section>
          : unavailable ? <section className={styles.empty} role="alert"><h2>Colony records are unavailable.</h2><p>Try again when the Keeper database is available.</p></section>
          : <ManagerColonies key={(member.userId||"guest")+":"+view+":"+(options.species||"")} scope={member.userId||"guest"} explicitView={Boolean(options.view||options.species||intent)} records={species} bins={active} allBins={bins.map(({speciesId,isArchived})=>({speciesId,isArchived}))} collectedIds={member.ids} intent={intent} initialSpecies={options.species} archivedView={archivedView} savedView={savedView} />}
      </div>
    </div>
    {member.signedIn ? <KeeperMobileNav active="keeper"/> : null}
  </PlatformShell>;
}
