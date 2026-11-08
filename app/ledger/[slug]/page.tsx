import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CollectionButton } from "@/components/CollectionButton";
import { PinToHome } from "@/components/PinToHome";
import { customerSupabase } from "@/lib/customer-auth/server";
import { Breadcrumbs, PlatformShell } from "@/components/PlatformShell";
import {WorkspaceLinks} from "@/components/PodscapeWorkspaceUI";
import { SpecimenLeaf } from "@/components/SpecimenLeaf";
import { SpeciesDiscoveryTracker } from "@/components/SpeciesDiscoveryTracker";
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
  const db=await customerSupabase();
  const {data:{user}}=db?await db.auth.getUser():{data:{user:null}};
  const collectionEntry = member.entries.find((entry) => entry.speciesId === record.id);
  const displayName = speciesDisplayName(record);
  const scientificName = speciesScientificName(record);
  // Only concise parameters belong in the compact reference grid.
  const care = [
    ["Care level", record.careLevel],
    ["Moisture", record.moisture],
    ["Temperature", record.temperature],
    ["Ventilation", record.ventilation],
    ["Reproduction", record.reproduction],
    ["Activity", record.activity],
  ].filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].trim().length > 0);

  // Owner-authored headings become individual expandable field-guide sections.
  // Older plain-text records still display as one Natural history section.
  const aboutSections = (record.about || "").split(/(?=^#{2,3}\\s+)/m)
    .map((part) => {
      const text = part.trim();
      const heading = text.match(/^#{2,3}\\s+([^\\n]+)\\n?/);
      return { title: heading ? heading[1].trim() : "Natural history", body: heading ? text.slice(heading[0].length).trim() : text };
    })
    .filter((part) => part.body);


  return <PlatformShell>
    <section className={styles.page}>
      <div className="v2-container">
        <Breadcrumbs items={[{ label: "Leaf Ledger", href: "/ledger" }, { label: displayName }]} />
        {member.signedIn && record.kind === "species" ? <SpeciesDiscoveryTracker speciesId={record.id} /> : null}

        <header className={styles.hero}>
          <div className={styles.intro}>
            <p className={styles.kicker}>Leaf Ledger · {record.catalogueNumber}</p>
            <h1>{displayName}</h1>
            <p className={styles.scientific}><em>{scientificName}</em></p>
            {record.summary ? <p className={styles.summary}>{record.summary}</p> : null}
            {record.kind==="species"&&record.status==="published"?<PinToHome pin={{kind:"species",id:record.slug}} userId={user?.id||null}/>:null}
            <div className={styles.metadata} aria-label="Record information">
              <span>{speciesGenus(record)}</span><span>{speciesRecordLabel(record)}</span>
            </div>
          </div>
          <div className={styles.artwork}>
            <SpecimenLeaf image={record.image} alt={record.imageAlt || scientificName}
              number={record.catalogueNumber} size="profile"
              positionX={record.imagePositionX} positionY={record.imagePositionY} zoom={record.imageZoom} />
          </div>
        </header>

        <div className={styles.body}>
          <section className={styles.section} aria-labelledby="record-care-title">
            <div className={styles.sectionHeading}><p className={styles.sectionKicker}>Husbandry</p><h2 id="record-care-title">Care at a glance</h2></div>
            {care.length ? <dl className={styles.careGrid}>
              {care.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl> : <p className={styles.empty}>Care information is awaiting review in the Leaf Ledger.</p>}
          </section>

          {(record.substrate || record.feeding || aboutSections.length || record.keeperNotes || record.fieldGuideLinks.length) ?
            <section className={styles.section} aria-labelledby="record-guide-title">
              <div className={styles.sectionHeading}><p className={styles.sectionKicker}>Explore the species</p><h2 id="record-guide-title">Field guide</h2></div>
              <div className={styles.accordion}>
                {record.substrate ? <details className={styles.topic}><summary>Substrate &amp; habitat</summary><div className={styles.topicBody}>{record.substrate}</div></details> : null}
                {record.feeding ? <details className={styles.topic}><summary>Feeding &amp; nutrition</summary><div className={styles.topicBody}>{record.feeding}</div></details> : null}
                {aboutSections.map((part, index) => <details className={styles.topic} key={index}><summary>{part.title}</summary><div className={styles.topicBody}>{part.body}</div></details>)}
                {record.keeperNotes ? <details className={styles.topic}><summary>Keeper observations</summary><div className={styles.topicBody}>{record.keeperNotes}</div></details> : null}
                {record.fieldGuideLinks.length ? <details className={styles.topic}><summary>Sources &amp; references</summary><div className={styles.topicBody}><ul className={styles.references}>{record.fieldGuideLinks.filter((url) => /^https:\/\//.test(url)).map((url) => <li key={url}><a href={url} target="_blank" rel="noopener noreferrer">{new URL(url).hostname}</a></li>)}</ul></div></details> : null}
              </div>
            </section> : null}

          <WorkspaceLinks items={[{label:"Explore more species",href:"/ledger"},{label:"My colonies",href:"/keeper/collection"}]}/>

          {record.kind === "species" ? <div className={styles.collectionArea} id="keeper-record">
            {collectionEntry ? <p>In your collection · <Link href={`/keeper?species=${encodeURIComponent(record.id)}`}>Manage colony in Keeper workspace →</Link></p>
              : <CollectionButton speciesId={record.id} speciesName={displayName} initialCollected={false} signedIn={member.signedIn} detail />}
          </div> : null}
        </div>
      </div>
    </section>
  </PlatformShell>;
}
