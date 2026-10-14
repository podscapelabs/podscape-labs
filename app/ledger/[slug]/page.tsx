import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CollectionButton } from "@/components/CollectionButton";
import { Breadcrumbs, PlatformShell } from "@/components/PlatformShell";
import { SpecimenLeaf } from "@/components/SpecimenLeaf";
import styles from "@/components/SpeciesProfile.module.css";
import { speciesDisplayName, speciesGenus, speciesRecordLabel, speciesScientificName } from "@/data/species";
import { getMemberCollectionState } from "@/lib/member-collection";
import { getSpeciesRecord } from "@/lib/species-store";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const record = await getSpeciesRecord((await params).slug);
  return { title: record ? `${speciesDisplayName(record)} — ${speciesScientificName(record)} | Podscape Leaf Ledger` : "Species record", robots: { index: false, follow: false } };
}

export default async function SpeciesPage({ params }: { params: Promise<{ slug: string }> }) {
  const record = await getSpeciesRecord((await params).slug);
  if (!record) notFound();

  const member = await getMemberCollectionState();
  const collectionEntry = member.entries.find((entry) => entry.speciesId === record.id);
  const displayName = speciesDisplayName(record);
  const scientificName = speciesScientificName(record);
  const care = [
    ["Care level", record.careLevel],
    ["Moisture", record.moisture],
    ["Temperature", record.temperature],
    ["Ventilation", record.ventilation],
    ["Substrate", record.substrate],
    ["Feeding", record.feeding],
  ].filter(([, value]) => typeof value === "string" && value.trim().length > 0);

  return <PlatformShell>
    <section className={styles.page}>
      <div className="v2-container">
        <Breadcrumbs items={[{ label: "Leaf Ledger", href: "/ledger" }, { label: displayName }]} />

        <header className={styles.hero}>
          <div className={styles.intro}>
            <p className={styles.kicker}>Leaf Ledger · Species record</p>
            <h1>{displayName}</h1>
            <p className={styles.scientific}><em>{scientificName}</em></p>
            {record.summary ? <p className={styles.summary}>{record.summary}</p> : null}
            <div className={styles.metadata} aria-label="Record information">
              <span>{record.catalogueNumber}</span>
              <span>{speciesGenus(record)}</span>
              <span>{speciesRecordLabel(record)}</span>
            </div>

            <div id="keeper-record" className={styles.keeperAnchor} />
            {record.kind === "species" ? collectionEntry
              ? <div className={styles.collectAction}><p style={{fontSize:".78rem",color:"var(--text-secondary)"}}>Saved to My Collection. Manage your individual colonies in the Keeper workspace.</p><Link href={`/keeper?species=${encodeURIComponent(record.id)}`} className="v2-button">Open Keeper workspace →</Link></div>
              : <div className={styles.collectAction}>
                <CollectionButton speciesId={record.id} speciesName={displayName} initialCollected={false} signedIn={member.signedIn} detail />
              </div>
              : null}
          </div>

          <div className={styles.artwork}>
            <SpecimenLeaf image={record.image} alt={record.imageAlt || scientificName}
              number={record.catalogueNumber} size="profile"
              positionX={record.imagePositionX} positionY={record.imagePositionY} zoom={record.imageZoom} />
          </div>
        </header>

        <div className={styles.body}>
          <section className={styles.section} aria-labelledby="record-care-title">
            <div className={styles.sectionHeading}>
              <p className={styles.sectionKicker}>Husbandry</p>
              <h2 id="record-care-title">Care at a glance</h2>
            </div>
            {care.length ? <dl className={styles.careGrid}>
              {care.map(([label, value]) => <div key={label}>
                <dt>{label}</dt><dd>{value}</dd>
              </div>)}
            </dl> : <p className={styles.empty}>Care information is awaiting review in the Leaf Ledger.</p>}
          </section>
          {record.about ? <section className={styles.section} aria-labelledby="record-about-title">
            <div className={styles.sectionHeading}>
              <p className={styles.sectionKicker}>Field notes</p>
              <h2 id="record-about-title">About this record</h2>
            </div>
            <p className={styles.longform}>{record.about}</p>
          </section> : null}
          {record.keeperNotes ? <section className={styles.section} aria-labelledby="record-keeper-notes-title">
            <div className={styles.sectionHeading}>
              <p className={styles.sectionKicker}>Published keeper observations</p>
              <h2 id="record-keeper-notes-title">Keeper notes</h2>
            </div>
            <p className={styles.longform}>{record.keeperNotes}</p>
          </section> : null}
        </div>
      </div>
    </section>
  </PlatformShell>;
}
