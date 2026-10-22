import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PlatformShell } from "@/components/PlatformShell";
import { CreateEnclosure } from "@/components/KeeperWorkspace";
import { KeeperMobileNav } from "@/components/KeeperMobileNav";
import { PodscapeLineIcon, type PodscapeIconName } from "@/components/PodscapeLineIcon";
import { getMemberCollectionState } from "@/lib/member-collection";
import { listEnclosures } from "@/lib/keeper";
import { getSpeciesRecords } from "@/lib/species-store";
import { speciesDisplayName, speciesScientificName } from "@/data/species";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Manager | PodScape Labs", robots: { index: false, follow: false } };

export default async function KeeperIndex({ searchParams }: { searchParams: Promise<{ species?: string }> }) {
  const member = await getMemberCollectionState();
  const species = member.signedIn ? await getSpeciesRecords() : [];
  let enclosures: Awaited<ReturnType<typeof listEnclosures>> = [];
  let unavailable = false;
  if (member.signedIn) try { enclosures = await listEnclosures(); } catch { unavailable = true; }

  const selected = (await searchParams).species;
  const selectedRecord = species.find((record) => record.id === selected && record.kind === "species");
  const speciesById = new Map(species.map((record) => [record.id, record]));
  const active = enclosures.filter((enclosure) => !enclosure.isArchived);
  const archived = enclosures.filter((enclosure) => enclosure.isArchived);
  const uniqueSpecies = new Set(active.map((enclosure) => enclosure.speciesId)).size;
  const totalPopulation = active.reduce((total, enclosure) => total + enclosure.quantity, 0);
  const heroRecord = speciesById.get(active[0]?.speciesId);
  const recent = [...active].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 3);
  const firstBinHref = active[0] ? `/keeper/${active[0].id}` : "/ledger/my-collection";
  const tools: { href: string; icon: PodscapeIconName; label: string }[] = [
    { href: "/keeper/scan", icon: "scan", label: "Scan bin" },
    { href: firstBinHref, icon: "qr", label: "Create QR" },
    { href: "/ledger/my-collection", icon: "bin", label: "Add bin" },
    { href: "/keeper/scan", icon: "droplet", label: "Log care" },
    { href: "/keeper/schedule", icon: "calendar", label: "Schedule" },
    { href: firstBinHref, icon: "note", label: "Notes" },
  ];

  return <PlatformShell>
    <main className={styles.page}>
      <section className={styles.hero}>
        {heroRecord?.image ? <Image className={styles.heroImage} src={heroRecord.image} alt={heroRecord.imageAlt || speciesDisplayName(heroRecord)} fill priority sizes="(max-width: 720px) 52vw, 45vw" style={{ objectPosition: `${heroRecord.imagePositionX}% ${heroRecord.imagePositionY}%` }} /> : null}
        <div className={styles.heroVeil} />
        <div className={styles.heroCopy}>
          <p>MANAGER</p>
          <h1>Dashboard</h1>
          <span>Quick access to your colony care and records.</span>
          <Link href="/ledger/my-collection">View My Collection <b>→</b></Link>
        </div>
        <em className={styles.heroNote}>Small<br />creatures.<br />Big world.</em>
      </section>

      <div className={styles.dashboard}>
        {!member.signedIn ? <section className={styles.empty}>
          <PodscapeLineIcon name="jar" /><h2>Your Manager is private.</h2>
          <p>Sign in to manage bins, care records, and colony details.</p>
          <Link href="/account/login">Member sign in →</Link>
        </section> : unavailable ? <section className={styles.empty} role="alert"><h2>Manager is temporarily unavailable.</h2><p>The Keeper database connection could not be reached.</p></section> : <>
          <section className={styles.metrics} aria-label="Keeper overview">
            <Link href="/ledger/my-collection"><PodscapeLineIcon name="leaf" /><strong>{uniqueSpecies}</strong><span>Species</span><b>›</b></Link>
            <Link href="#bins"><PodscapeLineIcon name="bin" /><strong>{active.length}</strong><span>Bins</span><b>›</b></Link>
            <Link href="#bins"><PodscapeLineIcon name="community" /><strong>{totalPopulation}</strong><span>Total count</span><b>›</b></Link>
          </section>

          <section className={styles.section}>
            <header><h2>Quick Tools</h2><Link href="/menu">View all <span>→</span></Link></header>
            <nav className={styles.tools} aria-label="Keeper quick tools">
              {tools.map((tool) => <Link href={tool.href} key={tool.label}><span><PodscapeLineIcon name={tool.icon} /></span><small>{tool.label}</small></Link>)}
            </nav>
          </section>

          {recent.length ? <section className={styles.section}>
            <header><h2>Recently Updated</h2><Link href="#bins">View all <span>→</span></Link></header>
            <div className={styles.attentionList}>{recent.map((enclosure) => {
              const record = speciesById.get(enclosure.speciesId);
              return <Link href={`/keeper/${enclosure.id}`} key={enclosure.id}>
                <span className={styles.thumb}>{record?.image ? <Image src={record.image} alt="" fill sizes="58px" style={{ objectFit: "cover", objectPosition: `${record.imagePositionX}% ${record.imagePositionY}%` }} /> : <PodscapeLineIcon name="jar" />}</span>
                <span><strong>{enclosure.name}</strong><small>{record ? speciesDisplayName(record) : "Species record"} · {enclosure.status.replaceAll("-", " ")}</small></span>
                <em>{enclosure.quantity} recorded</em><b>›</b>
              </Link>;
            })}</div>
          </section> : null}

          <section className={styles.section} id="bins">
            <header><h2>My Bins</h2><Link href="/ledger/my-collection">Add bin <span>＋</span></Link></header>
            {active.length ? <div className={styles.bins}>{active.map((enclosure) => {
              const record = speciesById.get(enclosure.speciesId);
              return <Link href={`/keeper/${enclosure.id}`} key={enclosure.id}>
                <span className={styles.binPhoto}>{record?.image ? <Image src={record.image} alt="" fill sizes="130px" style={{ objectFit: "cover", objectPosition: `${record.imagePositionX}% ${record.imagePositionY}%` }} /> : <PodscapeLineIcon name="jar" />}</span>
                <span className={styles.count}><strong>{enclosure.quantity}</strong> count</span>
                <strong>{enclosure.name}</strong>
                <small>{record ? speciesDisplayName(record) : "Species"}</small>
                <b>›</b>
              </Link>;
            })}</div> : <div className={styles.emptyInline}><p>No active bins yet.</p><Link href="/ledger/my-collection">Choose a species to add your first bin →</Link></div>}
          </section>

          {archived.length ? <details className={styles.archived}><summary>Archived bins ({archived.length})</summary><div>{archived.map((enclosure) => <Link href={`/keeper/${enclosure.id}`} key={enclosure.id}>{enclosure.name} →</Link>)}</div></details> : null}
          {selectedRecord ? <CreateEnclosure speciesId={selectedRecord.id} speciesName={`${speciesDisplayName(selectedRecord)} · ${speciesScientificName(selectedRecord)}`} /> : null}
        </>}
      </div>
    </main>
    {member.signedIn ? <KeeperMobileNav active="keeper" /> : null}
  </PlatformShell>;
}
