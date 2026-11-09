import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CollectionButton } from "@/components/CollectionButton";
import { SpeciesDashboardWorkspace } from "@/components/SpeciesDashboardWorkspace";
import {getSpeciesTraitId} from "@/lib/species-traits";
import {MoistureAndHumidityWidget,BreedingDevelopmentWidget,TaxonomyOriginWidget,FeedingEcologyWidget,HabitatSetupWidget,BehaviourEcologyWidget,ResearchSourcesWidget} from "@/components/SpeciesResearchWidgets";
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
import { isAdminAuthenticated } from "@/lib/admin-auth";

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

export default async function SpeciesPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ ownerPreview?: string }> }) {
  const record = await getSpeciesRecord((await params).slug);
  if (!record) notFound();
  const previewRequested = (await searchParams).ownerPreview === "1";
  const unpublished = record.status !== "published" || record.kind !== "species";
  // A draft may not be opened publicly, even when its direct slug is known.
  if ((unpublished || previewRequested) && !(previewRequested && await isAdminAuthenticated())) notFound();

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
  const moistureZoneNames=["Drier area","Lightly damp","Moderately damp","Moist","Very moist"];
  const rangeStart=record.moistureRangeStart;
  const rangeEnd=record.moistureRangeEnd;
  const hasReviewedRange=typeof rangeStart==="number" && typeof rangeEnd==="number"
    && Number.isInteger(rangeStart) && Number.isInteger(rangeEnd)
    && rangeStart>=1 && rangeEnd<=5 && rangeStart<=rangeEnd;
  const moistureRangeLabel=hasReviewedRange
    ? (rangeStart===rangeEnd ? moistureZoneNames[rangeStart-1] : moistureZoneNames[rangeStart-1]+" – "+moistureZoneNames[rangeEnd-1])
    : moisturePosition ? moistureLabels[moisturePosition] : "";

  // Specialist cards do not appear in the library until their data exists for this species.
  const hasResearch=(keys:(keyof typeof record)[])=>keys.some(key=>typeof record[key]==="string"&&Boolean((record[key] as string).trim()));
  const environmentAvailable=(Boolean(record.humidityMin?.trim())&&Boolean(record.humidityMax?.trim()))||hasResearch(["moistZoneCoverage","moistRefugeCondition","moistureGradientGuidance"]);
  const breedingAvailable=hasResearch(["broodAverage","incubationPeriod","maturityAge","breedingSeason"])||(Boolean(record.broodMin?.trim())&&Boolean(record.broodMax?.trim()));
  const taxonomyAvailable=hasResearch(["taxonomicStatus","taxonomicSynonyms","nativeDistribution","morphOrigin","identificationNotes","adultSizeMm","lifespan"]);
  const nutritionAvailable=hasResearch(["stapleDiet","proteinGuidance","calciumGuidance","dietaryCautions"]);
  const behaviourAvailable=hasResearch(["defensiveBehaviour","visibilityNotes","bioactiveSuitability"]);
  const habitatAdvancedAvailable=hasResearch(["naturalMicrohabitat","substrateDepth","enclosureGuidance"]);
  const sourcesAvailable=hasResearch(["researchSources","evidenceScope","evidenceQuality","evidenceNotes","lastReviewed"]);

  const notableTraits = [...new Set((record.notableTraits || []).map(trait => trait.trim()).filter(Boolean))].slice(0, 5);
  // Keep the hero distinctive; don't repeat information already in the care grid.
  const redundantTrait = (trait:string) => {
    const text=trait.toLowerCase();
    return (Boolean(record.reproduction?.trim()) && /prolific breeder|rapid colony growth|slow colony growth/.test(text))
      || (Boolean(record.activity?.trim()) && /frequently visible|mostly concealed/.test(text));
  };
  const heroTraits = notableTraits.filter(trait=>!redundantTrait(trait)).slice(0,3);
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
        {!previewRequested && member.signedIn && record.kind === "species" ? <SpeciesDiscoveryTracker speciesId={record.id} /> : null}
        {previewRequested ? <div className={styles.ownerPreviewBanner}><span>Private owner preview · {record.status}</span><Link href={`/admin/species?record=${encodeURIComponent(record.id)}`}>← Return to Ledger Desk</Link></div> : null}
        <div className={styles.profileTopline}>
          <Link href="/ledger" className={styles.ledgerBack}>← Leaf Ledger</Link>
          <span className={styles.catalogueLabel}>{record.catalogueNumber}</span>
        </div>

        <header className={styles.compactHero}>
          <div className={styles.identity}>
            <h1>{displayName}</h1>
            <p className={styles.scientific}><em>{scientificName}</em></p>
            <p className={styles.identityLine}>{speciesGenus(record)} <span aria-hidden="true">·</span> {speciesRecordLabel(record)}</p>
            {heroTraits.length ? <ul className={styles.heroTraits} aria-label="Distinctive traits">{heroTraits.map(trait=><li key={trait} data-trait-id={getSpeciesTraitId(trait)||undefined}>{trait}</li>)}</ul> : null}
          </div>
          <div className={styles.compactPhoto}>
            {record.image ? <Image src={record.image} alt={record.imageAlt || scientificName} fill sizes="(max-width:600px) 100vw, (max-width:1000px) 44vw, 400px" style={{objectFit:"contain",objectPosition:`${record.imagePositionX}% ${record.imagePositionY}%`,transform:`scale(${record.imageZoom})`}} /> : <span aria-label="Species photograph pending">Photo pending</span>}
          </div>
        </header>

        <div className={styles.dashboardBody}>
          <SpeciesDashboardWorkspace scope={user?.id || "guest"} preview={previewRequested} widgets={{
            about:about ? <details className={styles.dashboardAbout}>
              <summary><span className={styles.aboutSymbol} aria-hidden="true">❧</span><span className={styles.aboutSummary}><strong>About {displayName}</strong><span className={styles.aboutPreview}>{about}</span></span><span className={styles.aboutChevron} aria-hidden="true">⌄</span></summary>
              <div className={styles.aboutFull}><p>{authoredAbout || summary}</p></div>
            </details> : null,
            care:quickFacts.length ? <section className={styles.dashboardCare} aria-label="Basic care and behaviour">
              <div className={styles.dashboardSectionHead}><h2>Basic Care &amp; Behaviour</h2></div>
              <dl className={styles.dashboardFacts}>{quickFacts.map(({label,value})=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
            </section> : null,
            moisture: hasReviewedRange || moisturePosition ? <div className={styles.dashboardMoisture} aria-label={"General substrate moisture conditions: "+moistureRangeLabel}>
              <div className={styles.moistureTop}><strong>Substrate moisture range</strong><span>{moistureRangeLabel}</span></div>
              <div className={styles.moistureTrack} aria-hidden="true">{moistureZoneNames.map((item,index)=><span key={item} className={hasReviewedRange
                ? index+1>=rangeStart! && index+1<=rangeEnd! ? styles.moistureRangeSelected : ""
                : index===moistureIndex ? styles.moistureSelected : ""}/>)}</div>
              <div className={styles.moistureEnds}><span>Drier area</span><span>Moister refuge</span></div>
              <p className={styles.moistureContext}>{hasReviewedRange
                ? "Relative substrate dampness, not the percentage of the enclosure to wet. Drier does not mean bone-dry; keep an appropriate moist refuge."
                : "Relative dampness only, not whole-enclosure moisture or air humidity. Detailed conditions await review."}</p>
            </div> : legacyMoisturePending ? <p className={styles.moisturePending}>Substrate moisture information awaiting review.</p> : null,
            feeding: feeding && !nutritionAvailable ? <section className={styles.speciesInfoCard}><h2>Feeding overview</h2><p>{feeding}</p></section> : null,
            habitat: record.substrate?.trim() && !habitatAdvancedAvailable ? <section className={styles.speciesInfoCard}><h2>Habitat &amp; substrate</h2><p>{introText(record.substrate)}</p></section> : null,
            traits: notableTraits.length ? <section className={styles.speciesInfoCard}><h2>Notable traits</h2><ul className={styles.compactTraits}>{notableTraits.map(trait=><li key={trait} data-trait-id={getSpeciesTraitId(trait)||undefined}>{trait}</li>)}</ul></section> : null,
            guides: relatedGuides.length ? <section className={styles.speciesInfoCard}><h2>Related Field Guides</h2><div className={styles.relatedGuides}>{relatedGuides.map(guide=><Link href={`/field-guide/${guide.slug}`} key={guide.slug}><span><strong>{guide.title}</strong>{guide.summary?<small>{guide.summary}</small>:null}</span><b aria-hidden="true">→</b></Link>)}</div></section> : null,
            environment: environmentAvailable ? <MoistureAndHumidityWidget record={record}/> : null,
            breeding: breedingAvailable ? <BreedingDevelopmentWidget record={record}/> : null,
            taxonomy: taxonomyAvailable ? <TaxonomyOriginWidget record={record}/> : null,
            nutrition: nutritionAvailable ? <FeedingEcologyWidget record={record}/> : null,
            behaviour: behaviourAvailable ? <BehaviourEcologyWidget record={record}/> : null,
            habitatAdvanced: habitatAdvancedAvailable ? <HabitatSetupWidget record={record}/> : null,
            sources: sourcesAvailable ? <ResearchSourcesWidget record={record}/> : null,
            personal: !previewRequested && record.kind === "species" ? <section className={styles.dashboardPersonal} aria-label="Your PodScape">
            <div className={styles.dashboardPersonalTitle}>Your PodScape</div>
            <div className={styles.dashboardPersonalActions}>
              {record.status === "published" ? <PinToHome pin={{ kind: "species", id: record.slug }} userId={user?.id || null} /> : null}
              {collectionEntry ? <Link href="/keeper/collection" className={styles.collectionDestination}>✓ In collection · View colonies →</Link>
                : <CollectionButton speciesId={record.id} speciesName={displayName} initialCollected={false} signedIn={member.signedIn} detail />}
            </div>
          </section> : null,
            navigation: <nav className={styles.compactFooter} aria-label="Explore more">
            <Link href="/field-guide?topic=Species#all-guides">Explore species guides →</Link>
            <Link href="/ledger">← All species</Link>
          </nav>
          }} />

        </div>
      </div>
    </main>
  </PlatformShell>;
}
