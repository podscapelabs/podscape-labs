import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PlatformShell } from "@/components/PlatformShell";
import { ManagerWorkspace } from "@/components/ManagerWorkspace";
import type { ManagerBin } from "@/components/ManagerCareWidgets";
import { customerSupabase } from "@/lib/customer-auth/server";
import { CreateEnclosure } from "@/components/KeeperWorkspace";
import { KeeperMobileNav } from "@/components/KeeperMobileNav";
import { PodscapeLineIcon } from "@/components/PodscapeLineIcon";
import { getMemberCollectionState } from "@/lib/member-collection";
import { listEnclosures, listManagerActivity } from "@/lib/keeper";
import { getSpeciesRecords } from "@/lib/species-store";
import { speciesDisplayName, speciesScientificName } from "@/data/species";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Manager | PodScape Labs", robots: { index: false, follow: false } };

export default async function KeeperIndex({ searchParams }: { searchParams: Promise<{ species?: string }> }) {
  const member = await getMemberCollectionState();
  const authDb = member.signedIn ? await customerSupabase() : null;
  const {data:{user:managerUser}} = authDb ? await authDb.auth.getUser() : {data:{user:null}};
  const species = member.signedIn ? await getSpeciesRecords() : [];
  let enclosures: Awaited<ReturnType<typeof listEnclosures>> = [];
  let unavailable = false;
  if (member.signedIn) try { enclosures = await listEnclosures(); } catch { unavailable = true; }

  let activity: Awaited<ReturnType<typeof listManagerActivity>>=[];
  let activityAvailable=true;
  if(member.signedIn&&!unavailable)try{activity=await listManagerActivity(12);}catch{activityAvailable=false;}

  const selected = (await searchParams).species;
  const selectedRecord = species.find((record) => record.id === selected && record.kind === "species");
  const speciesById = new Map(species.map((record) => [record.id, record]));
  const active = enclosures.filter((enclosure) => !enclosure.isArchived);
  const archived = enclosures.filter((enclosure) => enclosure.isArchived);
  const uniqueSpecies = new Set(active.map(enclosure => enclosure.speciesId)).size;
  const totalPopulation = active.reduce((total, enclosure) => total + enclosure.quantity, 0);
  const recent = [...active].sort((a,b) => Date.parse(b.updatedAt)-Date.parse(a.updatedAt)).slice(0,5);
  const firstBinHref = active[0] ? `/keeper/${active[0].id}` : "/keeper/collection";
  const managerBins:ManagerBin[]=active.map(enclosure=>({
    id:enclosure.id,name:enclosure.name,label:enclosure.label,
    species:speciesById.get(enclosure.speciesId)?.commonName||"Species",
    quantity:enclosure.quantity,status:enclosure.status,breeding:enclosure.breeding,
    createdAt:enclosure.createdAt,updatedAt:enclosure.updatedAt
  }));

  return <PlatformShell>
    <main className={styles.page}>
      <section className={styles.managerIntro} aria-label="Your collection">
        <div><p>PODSCAPE / MANAGER</p><h1>Your collection.</h1><span>A little world of colonies, care and discoveries.</span></div>
        <Link href="/keeper/collection">All colonies <span aria-hidden="true">→</span></Link>
      </section>

      <div className={styles.dashboard}>
        {!member.signedIn ? <section className={styles.empty}>
          <PodscapeLineIcon name="jar" /><h2>Your Manager is private.</h2>
          <p>Sign in to manage bins, care records, and colony details.</p>
          <Link href="/account/login">Member sign in →</Link>
        </section> : unavailable ? <section className={styles.empty} role="alert"><h2>Manager is temporarily unavailable.</h2><p>The Keeper database connection could not be reached.</p></section> : <>
          <ManagerWorkspace scope={managerUser?.id || "guest"} primaryHref={firstBinHref} bins={managerBins} events={activity} activityAvailable={activityAvailable} stats={<section className={styles.metrics} aria-label="Keeper overview">
            <Link href="/keeper/collection"><PodscapeLineIcon name="leaf" /><strong>{uniqueSpecies}</strong><span>Species</span><b>›</b></Link>
            <Link href="/keeper/collection"><PodscapeLineIcon name="bin" /><strong>{active.length}</strong><span>Bins</span><b>›</b></Link>
            <Link href="/keeper/collection"><PodscapeLineIcon name="community" /><strong>{totalPopulation}</strong><span>Recorded population</span><b>›</b></Link>
          </section>} enclosures={<section className={styles.section}>
            <header><h2>Recently updated</h2><Link href="/keeper/collection">View all <span>→</span></Link></header>
            {recent.length ? <div className={styles.attentionList}>{recent.map(enclosure => {
              const record = speciesById.get(enclosure.speciesId);
              return <Link href={`/keeper/${enclosure.id}`} key={enclosure.id}>
                <span className={styles.thumb}>{record?.image ? <Image src={record.image} alt="" fill sizes="58px" style={{objectFit:"cover",objectPosition:`${record.imagePositionX}% ${record.imagePositionY}%`}}/>:<PodscapeLineIcon name="jar"/>}</span>
                <span><strong>{enclosure.name === "Primary colony" && record ? speciesDisplayName(record) : enclosure.name}</strong><small>{record ? speciesDisplayName(record) : "Species record"} · {enclosure.status.replaceAll("-"," ")}</small></span>
                <em>{enclosure.quantity} recorded</em><b>›</b>
              </Link>;
            })}</div> : <div className={styles.emptyInline}><p>No active colonies yet.</p><Link href="/keeper/collection">Explore your collection →</Link></div>}
          </section>} />
          {archived.length ? <details className={styles.archived}><summary>Archived bins ({archived.length})</summary><div>{archived.map((enclosure) => <Link href={`/keeper/${enclosure.id}`} key={enclosure.id}>{enclosure.name} →</Link>)}</div></details> : null}
          {selectedRecord ? <CreateEnclosure speciesId={selectedRecord.id} speciesName={`${speciesDisplayName(selectedRecord)} · ${speciesScientificName(selectedRecord)}`} /> : null}
        </>}
      </div>
    </main>
    {member.signedIn ? <KeeperMobileNav active="keeper" /> : null}
  </PlatformShell>;
}
