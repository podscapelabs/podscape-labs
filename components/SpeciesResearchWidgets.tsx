import type {ReactNode} from "react";
import type {SpeciesRecord} from "@/data/species";
import styles from "@/components/SpeciesProfile.module.css";

function has(record:SpeciesRecord,keys:(keyof SpeciesRecord)[]){return keys.some(k=>typeof record[k]==="string"&&Boolean((record[k] as string).trim()));}
function Details({title,rows,note}:{title:string;rows:{label:string;value:string|undefined}[];note?:string}){
 const active=rows.filter(r=>r.value?.trim());
 if(!active.length)return null;
 return <section className={styles.speciesInfoCard}><h2>{title}</h2><dl className={styles.researchFacts}>{active.map(r=><div key={r.label}><dt>{r.label}</dt><dd>{r.value}</dd></div>)}</dl>{note?<p className={styles.researchDisclaimer}>{note}</p>:null}</section>;
}
function PercentBar({min,max}:{min:number;max:number}){
 return <div className={styles.researchPercentTrack} role="img" aria-label={min===max?min+" percent":min+" to "+max+" percent"}><span style={{left:min+"%",width:Math.max(max-min,1)+"%"}}/></div>;
}
function validPercent(v:string|undefined){if(!v||!/^(?:100|[1-9]?\d)$/.test(v))return null;return Number(v);}
export function MoistureAndHumidityWidget({record}:{record:SpeciesRecord}){
 const low=validPercent(record.humidityMin),high=validPercent(record.humidityMax),coverage=validPercent(record.moistZoneCoverage);
 const hasHumidity=low!==null&&high!==null&&low<=high;
 const hasCoverage=coverage!==null;
 const refuge=["Lightly damp","Moist","Very moist"].indexOf(record.moistRefugeCondition||"");
 if(!hasHumidity&&!hasCoverage&&refuge<0&&!record.moistureGradientGuidance?.trim())return null;
 return <section className={styles.speciesInfoCard} aria-label="Moisture and humidity">
  <h2>Moisture &amp; Humidity</h2>
  {hasHumidity?<div className={styles.researchMeter}><div><strong>Relative humidity (air)</strong><b>{low===high?low:low+"–"+high}% RH</b></div><PercentBar min={low} max={high}/><small>0% RH <span>100% RH</span></small></div>:null}
  {hasCoverage?<div className={styles.researchMeter}><div><strong>Moist-zone coverage</strong><b>~{coverage}% of enclosure</b></div><div className={styles.researchCoverage} role="img" aria-label={coverage+" percent moist zone and "+(100-coverage)+" percent less-wet area"}><span style={{width:coverage+"%"}}/></div><small>Moist refuge <span>Less-wet area</span></small></div>:null}
  {refuge>=0?<div className={styles.researchMeter}><div><strong>Moist-refuge substrate</strong><b>{record.moistRefugeCondition}</b></div><div className={styles.researchRefuge} role="img" aria-label={"Moist refuge substrate: "+record.moistRefugeCondition}>{["Lightly damp","Moist","Very moist"].map((label,i)=><span key={label} className={i===refuge?styles.researchRefugeActive:""}/>)}</div><small>Lightly damp <span>Very moist</span></small><p>Describes the moist refuge only—not the entire enclosure. Avoid waterlogging.</p></div>:null}
  {record.moistureGradientGuidance?.trim()?<p>{record.moistureGradientGuidance}</p>:null}
  <p className={styles.researchDisclaimer}>RH, moist-zone coverage and substrate moisture describe different conditions. All figures are approximate husbandry recommendations, not measured species preferences.</p>
 </section>;
}
export function BreedingDevelopmentWidget({record}:{record:SpeciesRecord}){
 const avg=record.broodAverage?.trim(),min=record.broodMin?.trim(),max=record.broodMax?.trim();
 return <Details title="Breeding & Development" rows={[
  {label:"Reproduction rate",value:record.reproduction},{label:"Average brood",value:avg?avg+" young":undefined},
  {label:"Observed brood range",value:min&&max?min+"–"+max+" young":undefined},
  {label:"Incubation / brooding",value:record.incubationPeriod},{label:"Age at maturity",value:record.maturityAge},
  {label:"Breeding season",value:record.breedingSeason}
 ]} note={has(record,["broodAverage","broodMin","broodMax"])?"Brood measurements depend on the studied population and conditions. Check Research & Sources for evidence scope.":undefined}/>;
}
export function TaxonomyOriginWidget({record}:{record:SpeciesRecord}){
 return <Details title="Taxonomy & Origin" rows={[
 {label:"Taxonomic status",value:record.taxonomicStatus},{label:"Synonyms",value:record.taxonomicSynonyms},
 {label:"Native distribution",value:record.nativeDistribution},{label:"Natural microhabitat",value:record.naturalMicrohabitat},
 {label:"Morph origin",value:record.morphOrigin},{label:"Adult size",value:record.adultSizeMm?.trim()?record.adultSizeMm+" mm":undefined},
 {label:"Lifespan",value:record.lifespan},{label:"Identification & lookalikes",value:record.identificationNotes}
 ]}/>;
}
export function FeedingEcologyWidget({record}:{record:SpeciesRecord}){
 return <Details title="Feeding & Ecology" rows={[
 {label:"Staple diet",value:record.stapleDiet},{label:"Protein",value:record.proteinGuidance},{label:"Calcium",value:record.calciumGuidance},
 {label:"Dietary cautions",value:record.dietaryCautions},{label:"Defensive behaviour",value:record.defensiveBehaviour},
 {label:"Activity & visibility",value:record.visibilityNotes},{label:"Bioactive suitability",value:record.bioactiveSuitability}
 ]}/>;
}
export function ResearchSourcesWidget({record}:{record:SpeciesRecord}){
 const lines=(record.researchSources||"").split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 const links=lines.filter(s=>{try{return ["https:","http:"].includes(new URL(s).protocol)}catch{return false}});
 if(!links.length&&!has(record,["evidenceScope","evidenceQuality","evidenceNotes","lastReviewed"]))return null;
 return <section className={styles.speciesInfoCard}><h2>Research &amp; Sources</h2>
 <dl className={styles.researchFacts}>
 {record.evidenceScope?<div><dt>Evidence scope</dt><dd>{record.evidenceScope}</dd></div>:null}
 {record.evidenceQuality?<div><dt>Evidence basis</dt><dd>{record.evidenceQuality}</dd></div>:null}
 {record.lastReviewed?<div><dt>Last reviewed</dt><dd>{record.lastReviewed}</dd></div>:null}
 {record.evidenceNotes?<div><dt>Evidence &amp; uncertainty</dt><dd>{record.evidenceNotes}</dd></div>:null}
 </dl>
 {links.length?<div className={styles.researchLinks}><strong>Original references</strong>{links.map(url=><a key={url} href={url} target="_blank" rel="noopener noreferrer">{url}</a>)}</div>:null}
 <p className={styles.researchDisclaimer}>Seller consensus and scientific measurements are different evidence types. Species-level findings may not have been measured for a particular morph.</p>
 </section>;
}
export function HabitatSetupWidget({record}:{record:SpeciesRecord}){
 return <Details title="Habitat & Setup" rows={[
 {label:"Natural microhabitat",value:record.naturalMicrohabitat},{label:"Substrate depth",value:record.substrateDepth},
 {label:"Enclosure guidance",value:record.enclosureGuidance},{label:"Moisture arrangement",value:record.moistureGradientGuidance}
 ]} note="Enclosure advice varies with colony size, ventilation and local conditions."/>;
}
