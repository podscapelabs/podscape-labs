import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CollectionButton } from "@/components/CollectionButton";
import { PinToHome } from "@/components/PinToHome";
import { customerSupabase } from "@/lib/customer-auth/server";
import { PlatformShell } from "@/components/PlatformShell";
import Image from "next/image";
import { type MoisturePosition } from "@/components/SpeciesMoistureGradient";
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
  if (!plain) return "";
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

  const [member, db] = await Promise.all([getMemberCollectionState(), customerSupabase()]);
  const { data: { user } } = db ? await db.auth.getUser() : { data: { user: null } };
  const collectionEntry = member.entries.find(entry => entry.speciesId === record.id);
  const displayName = speciesDisplayName(record);
  const scientificName = speciesScientificName(record);

  // Only render explicitly authored species facts. Empty fields never become assumptions.
  const moisturePositions:MoisturePosition[]=["dry-leaning","dry-balanced","balanced","balanced-moist","moist-leaning"];
  const moisturePosition = moisturePositions.find(value=>value===record.moistureProfile);
  const quickFacts = [
    {label:"Care level",value:record.careLevel},
    {label:"Temperature",value:record.temperature,note:record.temperatureNote},
    {label:"Ventilation",value:record.ventilation,note:record.ventilationNote},
    {label:"Activity",value:record.activity,note:record.activityNote},
    {label:"Reproduction",value:record.reproduction,note:record.reproductionNote},
    {label:"Feeding response",value:record.feedingResponse,note:record.feedingResponseNote},
  ].filter(entry=>typeof entry.value==="string"&&entry.value.trim().length>0&&entry.value!=="Not established");
  // Do not publish legacy "Low / High" moisture without gradient context.
  // Existing values remain in the Desk until editors review each record.
  const legacyMoisturePending = !moisturePosition && Boolean(record.moisture?.trim());

  // Legacy preview copy must never masquerade as a published species description.
  const isPlaceholder = (value: string) => /temporary (?:visual )?record for testing|placeholder (?:text|description)|lorem ipsum/i.test(value);
  const summary = isPlaceholder(record.summary || "") ? "" : record.summary || "";
  const authoredAbout = isPlaceholder(record.about || "") ? "" : record.about || "";
  const about = introText(authoredAbout || summary);
  const feeding = introText(record.feeding || "");
  const moistureLabels:Record<MoisturePosition,string>={"dry-leaning":"Dry-leaning","dry-balanced":"Dry to balanced","balanced":"Balanced","balanced-moist":"Balanced to moist","moist-leaning":"Moist-leaning"};
  const moistureIndex = moisturePosition ? moisturePositions.indexOf(moisturePosition) : -1;
  const notableTraits = [...new Set((record.notableTraits || []).map(trait => trait.trim()).filter(Boolean))].slice(0, 5);
  // Keep the hero distinctive; don't repeat information already in the care grid.
  const redundantTrait = (trait:string) => {
    const text=trait.toLowerCase();
    return (Boolean(record.reproduction?.trim()) && /prolific breeder|rapid colony growth|slow colony growth/.test(text))
      || (Boolean(record.feedingResponse?.trim()) && /strong feeding response/.test(text))
      || (Boolean(record.activity?.trim()) && /frequently visible|mostly concealed/.test(text));
  };
  const heroTraits = notableTraits.filter(trait=>!redundantTrait(trait)).slice(0,3);
  const moreTraits = notableTraits.filter(trait=>!heroTraits.includes(trait)&&!redundantTrait(trait));
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
    <main className={styles.page}>
      <div className="v2-container">
        {member.signedIn && record.kind === "species" ? <SpeciesDiscoveryTracker speciesId={record.id} /> : null}
        <div className={styles.profileTopline}>
          <Link href="/ledger" className={styles.ledgerBack}>← Leaf Ledger</Link>
          <span className={styles.catalogueLabel}>{record.catalogueNumber}</span>
        </div>

        <header className={styles.compactHero}>
          <div className={styles.identity}>
            <h1>{displayName}</h1>
            <p className={styles.scientific}><em>{scientificName}</em></p>
            <p className={styles.identityLine}>{speciesGenus(record)} <span aria-hidden="true">·</span> {speciesRecordLabel(record)}</p>
            {heroTraits.length ? <ul className={styles.heroTraits} aria-label="Distinctive traits">{heroTraits.map(trait=><li key={trait}>{trait}</li>)}</ul> : null}
          </div>
          <div className={styles.compactPhoto}>
            {record.image ? <Image src={record.image} alt={record.imageAlt || scientificName} fill sizes="(max-width:600px) 104px, 144px" style={{objectFit:"cover",objectPosition:`${record.imagePositionX}% ${record.imagePositionY}%`,transform:`scale(${record.imageZoom})`}} /> : <span aria-label="Species photograph pending">Photo pending</span>}
          </div>
        </header>

        <div className={styles.dashboardBody}>
          {about ? <section className={styles.dashboardAbout} aria-labelledby="species-about">
            <span className={styles.aboutSymbol} aria-hidden="true">❧</span>
            <div><h2 id="species-about">About {displayName}</h2><p>{about}</p></div>
          </section> : null}

          <section className={styles.dashboardCare} aria-labelledby="record-care-title">
            <div className={styles.dashboardSectionHead}><div><p className={styles.sectionKicker}>Basic care &amp; behaviour</p><h2 id="record-care-title">At a glance</h2></div></div>
            {quickFacts.length ? <dl className={styles.dashboardFacts}>
              {quickFacts.map(({label,value})=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl> : null}
            {moisturePosition ? <div className={styles.dashboardMoisture} aria-label={"Moisture preference: "+moistureLabels[moisturePosition]}>
              <div className={styles.moistureTop}><strong>Moisture preference</strong><span>{moistureLabels[moisturePosition]}</span></div>
              <div className={styles.moistureTrack} aria-hidden="true">{moisturePositions.map((item,index)=><span key={item} className={index===moistureIndex?styles.moistureSelected:""}/>)}</div>
              <div className={styles.moistureEnds}><span>Dry</span><span>Moist</span></div>
            </div> : legacyMoisturePending ? <p className={styles.moisturePending}>Moisture preference awaiting review.</p> : null}
            {!quickFacts.length&&!moisturePosition ? <p className={styles.empty}>Care characteristics are being prepared for this species.</p> : null}
          </section>

          <details className={styles.dashboardExplore}>
            <summary><span className={styles.exploreMark} aria-hidden="true">✧</span><span className={styles.exploreCopy}><strong>Explore more</strong><small>Feeding, habitat, traits &amp; detailed guides</small></span><span className={styles.exploreArrow} aria-hidden="true">⌄</span></summary>
            <div className={styles.detailContents}>
              {feeding ? <div className={styles.detailItem}><strong>Feeding overview</strong><p>{feeding}</p></div> : null}
              {record.substrate?.trim() ? <div className={styles.detailItem}><strong>Substrate overview</strong><p>{introText(record.substrate)}</p></div> : null}
              {moreTraits.length ? <div className={styles.detailItem}><strong>Additional traits</strong><ul className={styles.compactTraits}>{moreTraits.map(trait=><li key={trait}>{trait}</li>)}</ul></div> : null}
              {relatedGuides.length ? <div className={styles.relatedGuides}>{relatedGuides.map(guide=><Link href={`/field-guide/${guide.slug}`} key={guide.slug}><span><strong>{guide.title}</strong>{guide.summary?<small>{guide.summary}</small>:null}</span><b aria-hidden="true">→</b></Link>)}</div> : null}
              <p className={styles.detailDisclaimer}>These are general species tendencies, not precise care requirements. Provide an appropriate moisture gradient, and consult reliable species guides for specific husbandry.</p>
              <Link className={styles.exploreGuideLink} href="/field-guide?topic=Species#all-guides">Browse Field Guides →</Link>
            </div>
          </details>

          {record.kind === "species" ? <section className={styles.dashboardPersonal} aria-label="Your PodScape">
            <div className={styles.dashboardPersonalTitle}>Your PodScape</div>
            <div className={styles.dashboardPersonalActions}>
              {record.status === "published" ? <PinToHome pin={{ kind: "species", id: record.slug }} userId={user?.id || null} /> : null}
              {collectionEntry ? <Link href="/keeper/collection" className={styles.collectionDestination}>✓ In collection · View colonies →</Link>
                : <CollectionButton speciesId={record.id} speciesName={displayName} initialCollected={false} signedIn={member.signedIn} detail />}
            </div>
          </section> : null}
          <nav className={styles.compactFooter} aria-label="Explore more">
            <Link href="/field-guide?topic=Species#all-guides">Explore species guides →</Link>
            <Link href="/ledger">← All species</Link>
          </nav>
        </div>
      </div>
    </main>
  </PlatformShell>;
}
