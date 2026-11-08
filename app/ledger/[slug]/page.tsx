import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CollectionButton } from "@/components/CollectionButton";
import { PinToHome } from "@/components/PinToHome";
import { customerSupabase } from "@/lib/customer-auth/server";
import { Breadcrumbs, PlatformShell } from "@/components/PlatformShell";
import { SpecimenLeaf } from "@/components/SpecimenLeaf";
import { SpeciesDiscoveryTracker } from "@/components/SpeciesDiscoveryTracker";
import styles from "@/components/SpeciesProfile.module.css";
import { speciesDisplayName, speciesGenus, speciesRecordLabel, speciesScientificName } from "@/data/species";
import { isGuideActive } from "@/data/guides";
import { getGuideRecords } from "@/lib/guide-store";
import { getMemberCollectionState } from "@/lib/member-collection";
import { getSpeciesRecord } from "@/lib/species-store";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const record = await getSpeciesRecord((await params).slug);
  return { title: record ? `${speciesDisplayName(record)} — ${speciesScientificName(record)} | Podscape Leaf Ledger` : "Species record", robots: { index: false, follow: false } };
}

/** A short introductory extract, not a second full husbandry article. */
function introText(value: string, fallback = "") {
  const plain = value.replace(/#{1,6}\s+/g, "").replace(/\s+/g, " ").trim();
  if (!plain) return fallback;
  if (plain.length <= 235) return plain;
  const firstTwo = plain.match(/^(.+?[.!?])(?:\s+(.+?[.!?]))?(?:\s|$)/);
  const sentenceText = firstTwo ? [firstTwo[1], firstTwo[2]].filter(Boolean).join(" ") : "";
  if (sentenceText.length >= 60 && sentenceText.length <= 260) return sentenceText;
  const cutoff = plain.lastIndexOf(" ", 232);
  return plain.slice(0, cutoff > 120 ? cutoff : 232).trimEnd() + "…";
}

export default async function SpeciesPage({ params }: { params: Promise<{ slug: string }> }) {
  const record = await getSpeciesRecord((await params).slug);
  if (!record) notFound();

  const member = await getMemberCollectionState();
  const db = await customerSupabase();
  const { data: { user } } = db ? await db.auth.getUser() : { data: { user: null } };
  const collectionEntry = member.entries.find(entry => entry.speciesId === record.id);
  const displayName = speciesDisplayName(record);
  const scientificName = speciesScientificName(record);

  // Only render explicitly authored species facts. Empty fields never become assumptions.
  const quickFacts = [
    ["Care level", record.careLevel],
    ["Moisture", record.moisture],
    ["Temperature", record.temperature],
    ["Ventilation", record.ventilation],
    ["Activity", record.activity],
    ["Reproduction", record.reproduction],
  ].filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].trim().length > 0);

  const about = introText(record.summary || record.about);
  const feeding = introText(record.feeding);
  let relatedGuides: { slug: string; title: string; summary: string }[] = [];
  try {
    const guides = await getGuideRecords();
    relatedGuides = guides.filter(guide => isGuideActive(guide) && guide.status === "published"
      && guide.relatedSpeciesSlugs.includes(record.slug))
      .map(guide => ({ slug: guide.slug, title: guide.title, summary: guide.summary }));
  } catch {
    // A temporary guide-store outage should never prevent a species profile loading.
  }

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
            <div className={styles.metadata} aria-label="Record identity">
              <span>{speciesGenus(record)}</span><span>{speciesRecordLabel(record)}</span>
            </div>
            {record.kind === "species" && record.status === "published"
              ? <div className={styles.heroAction}><PinToHome pin={{ kind: "species", id: record.slug }} userId={user?.id || null} /></div>
              : null}
          </div>
          <div className={styles.artwork}>
            <SpecimenLeaf image={record.image} alt={record.imageAlt || scientificName}
              number={record.catalogueNumber} size="profile"
              positionX={record.imagePositionX} positionY={record.imagePositionY} zoom={record.imageZoom} />
          </div>
        </header>

        <div className={styles.body}>
          {about ? <section className={styles.section} aria-labelledby="record-about-title">
            <div className={styles.sectionHeading}>
              <p className={styles.sectionKicker}>Species overview</p>
              <h2 id="record-about-title">About {displayName}</h2>
            </div>
            <div className={styles.aboutCard}><p>{about}</p></div>
          </section> : null}

          <section className={styles.section} aria-labelledby="record-care-title">
            <div className={styles.sectionHeading}>
              <p className={styles.sectionKicker}>Quick reference</p>
              <h2 id="record-care-title">At a glance</h2>
            </div>
            {quickFacts.length ? <dl className={styles.careGrid}>
              {quickFacts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl> : <p className={styles.empty}>Species characteristics have not been added to this entry yet.</p>}
          </section>

          {feeding ? <section className={styles.section} aria-labelledby="record-feeding-title">
            <div className={styles.sectionHeading}>
              <p className={styles.sectionKicker}>General information</p>
              <h2 id="record-feeding-title">Feeding</h2>
            </div>
            <div className={styles.aboutCard}><p>{feeding}</p></div>
          </section> : null}

          <section className={styles.section} aria-labelledby="record-guides-title">
            <div className={styles.sectionHeading}>
              <p className={styles.sectionKicker}>Want to learn more?</p>
              <h2 id="record-guides-title">Explore guides</h2>
            </div>
            <div className={styles.guidePanel}>
              <div className={styles.guideIntro}>
                <strong>Go beyond the snapshot</strong>
                <p>For detailed habitat setup, feeding, and colony care, explore the Field Guide.</p>
              </div>
              {relatedGuides.length ? <div className={styles.relatedGuides}>
                {relatedGuides.map(guide => <Link href={`/field-guide/${guide.slug}`} key={guide.slug}>
                  <span><strong>{guide.title}</strong>{guide.summary ? <small>{guide.summary}</small> : null}</span><b aria-hidden="true">→</b>
                </Link>)}
              </div> : null}
              <Link className={styles.guideLink} href="/field-guide?topic=Species#all-guides">Browse species guides →</Link>
            </div>
          </section>

          {record.kind === "species" ? <section className={styles.section} id="keeper-record" aria-labelledby="record-collection-title">
            <div className={styles.sectionHeading}>
              <p className={styles.sectionKicker}>Your PodScape</p>
              <h2 id="record-collection-title">My collection</h2>
            </div>
            <div className={styles.collectionCard}>
              {collectionEntry
                ? <><p>This species is in your collection.</p><Link href="/keeper/collection">View your colonies →</Link></>
                : <><p>Keep track of the species you own in My Collection.</p><CollectionButton speciesId={record.id} speciesName={displayName} initialCollected={false} signedIn={member.signedIn} detail /></>}
            </div>
          </section> : null}

          <nav className={styles.bottomNav} aria-label="Continue exploring">
            <Link href="/ledger">← Back to Leaf Ledger</Link>
            <Link href="/keeper/collection">My Colonies →</Link>
          </nav>
        </div>
      </div>
    </section>
  </PlatformShell>;
}
