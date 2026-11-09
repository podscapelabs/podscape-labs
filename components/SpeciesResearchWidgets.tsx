import type {SpeciesRecord} from "@/data/species";
import styles from "@/components/SpeciesProfile.module.css";

function has(record:SpeciesRecord,keys:(keyof SpeciesRecord)[]){return keys.some(k=>typeof record[k]==="string"&&Boolean((record[k] as string).trim()));}
function Details({title,rows,note}:{title:string;rows:{label:string;value:string|undefined}[];note?:string}){
 const active=rows.filter(r=>r.value?.trim());
 if(!active.length)return null;
 return <section className={styles.speciesInfoCard}><h2>{title}</h2><dl className={styles.researchFacts}>{active.map(r=><div key={r.label}><dt>{r.label}</dt><dd>{r.value}</dd></div>)}</dl>{note?<p className={styles.researchDisclaimer}>{note}</p>:null}</section>;
}
function validPercent(v:string|undefined){
 if(!v||!/^(?:100|[1-9]?\d)$/.test(v.trim()))return null;
 return Number(v.trim());
}
const moistureLabels:Record<string,string>={
 "dry-leaning":"Dry-leaning","dry-balanced":"Dry to balanced",
 balanced:"Balanced","balanced-moist":"Balanced to moist","moist-leaning":"Moist-leaning"
};
const moistureZones=["Drier area","Lightly damp","Moderately damp","Moist","Very moist"];
/** One visible moisture widget, using existing editorial fields without inferring new values. */
export function MoistureAndHumidityWidget({record}:{record:SpeciesRecord}){
 const rawStart=record.moistureRangeStart,rawEnd=record.moistureRangeEnd;
 const reviewed=typeof rawStart==="number"&&typeof rawEnd==="number"
  &&Number.isInteger(rawStart)&&Number.isInteger(rawEnd)
  &&rawStart>=1&&rawStart<=5&&rawEnd>=rawStart&&rawEnd<=5;
 const profileIndex=["dry-leaning","dry-balanced","balanced","balanced-moist","moist-leaning"].indexOf(record.moistureProfile||"");
 const hasSubstrate=reviewed||profileIndex>=0;
 const min=validPercent(record.humidityMin),max=validPercent(record.humidityMax);
 const hasHumidity=min!==null&&max!==null&&min<=max;
 const coverage=validPercent(record.moistZoneCoverage);
 const refuge=record.moistRefugeCondition?.trim()||"";
 const guidance=record.moistureGradientGuidance?.trim()||"";
 if(!hasSubstrate&&!hasHumidity&&coverage===null&&!refuge&&!guidance)return null;
 const start=reviewed?rawStart!:profileIndex+1,end=reviewed?rawEnd!:profileIndex+1;
 const substrateLabel=reviewed
  ? start===end?moistureZones[start-1]:moistureZones[start-1]+" – "+moistureZones[end-1]
  : moistureLabels[record.moistureProfile||""]||"Not established";
 return <section className={styles.speciesInfoCard+" "+styles.moistureWidget} aria-label="Moisture and humidity">
  <h2>Moisture &amp; Humidity</h2>
  <div className={styles.moistureMeters}>
   <div className={styles.moistureMeter}>
    <div className={styles.moistureMeterHead}><strong>Substrate moisture</strong><b>{hasSubstrate?substrateLabel:"Not established"}</b></div>
    <div className={styles.moistureGradient} role="img" aria-label={hasSubstrate?"Substrate moisture preference: "+substrateLabel:"Substrate moisture preference not established"}>
     {moistureZones.map((label,index)=><span key={label} className={hasSubstrate&&index+1>=start&&index+1<=end?styles.moistureZoneActive:undefined}/>)}
    </div>
    <div className={styles.moistureMeterEnds}><span>Drier area</span><span>Moister refuge</span></div>
   </div>
   <div className={styles.moistureMeter}>
    <div className={styles.moistureMeterHead}><strong>Air humidity</strong><b>{hasHumidity?"~"+(min===max?min:min+"–"+max)+"% RH":"Not established"}</b></div>
    <div className={styles.moistureHumidityTrack} role="img" aria-label={hasHumidity?"Approximate air humidity range: "+min+" to "+max+" percent relative humidity":"Air humidity range not established"}>
     {hasHumidity?<span className={styles.moistureHumidityFill} style={{left:min+"%",width:Math.max(max-min,1)+"%"}}/>:null}
     {hasHumidity?<><i style={{left:min+"%"}}/><i style={{left:max+"%"}}/></>:null}
    </div>
    <div className={styles.moistureMeterEnds}><span>0% RH</span><span>100% RH</span></div>
   </div>
   <div className={styles.moistureMeter}>
    <div className={styles.moistureMeterHead}><strong>Moist-area coverage</strong><b>{coverage!==null?"~"+coverage+"% of enclosure":"Not established"}</b></div>
    <div className={styles.moistureCoverageTrack} role="img" aria-label={coverage!==null?"Approximately "+coverage+" percent of enclosure maintained as a moist area":"Moist-area coverage not established"}>
     {coverage!==null?<span style={{width:coverage+"%"}}/>:null}
    </div>
    <div className={styles.moistureMeterEnds}><span>Less coverage</span><span>More coverage</span></div>
   </div>
  </div>
  {(refuge||guidance)?<details className={styles.moistureDetails}>
   <summary>Moisture care notes</summary>
   <div>
    {refuge?<p><strong>Moist-side dampness:</strong> {refuge}. This describes the moist refuge, not the entire enclosure.</p>:null}
    {guidance?<p>{guidance}</p>:null}
    <p>Air humidity, substrate moisture and moist-area coverage are distinct measurements. Avoid waterlogging.</p>
   </div>
  </details>:null}
 </section>;
}
export function BreedingDevelopmentWidget({record}:{record:SpeciesRecord}){
 const avg=record.broodAverage?.trim(),min=record.broodMin?.trim(),max=record.broodMax?.trim();
 return <Details title="Breeding & Development" rows={[
  {label:"Average brood",value:avg?avg+" young":undefined},
  {label:"Observed brood range",value:min&&max?min+"–"+max+" young":undefined},
  {label:"Incubation / brooding",value:record.incubationPeriod},{label:"Age at maturity",value:record.maturityAge},
  {label:"Breeding season",value:record.breedingSeason}
 ]} note={has(record,["broodAverage","broodMin","broodMax"])?"Brood measurements depend on the studied population and conditions. Check Research & Sources for evidence scope.":undefined}/>;
}
export function TaxonomyOriginWidget({record}:{record:SpeciesRecord}){
 return <Details title="Taxonomy & Origin" rows={[
 {label:"Taxonomic status",value:record.taxonomicStatus},{label:"Synonyms",value:record.taxonomicSynonyms},
 {label:"Native distribution",value:record.nativeDistribution},
 {label:"Morph origin",value:record.morphOrigin},{label:"Adult size",value:record.adultSizeMm?.trim()?record.adultSizeMm+" mm":undefined},
 {label:"Lifespan",value:record.lifespan},{label:"Identification & lookalikes",value:record.identificationNotes}
 ]}/>;
}
export function FeedingEcologyWidget({record}:{record:SpeciesRecord}){
 return <Details title="Feeding & Nutrition" rows={[
 {label:"Staple diet",value:record.stapleDiet},{label:"Protein",value:record.proteinGuidance},{label:"Calcium",value:record.calciumGuidance},
 {label:"Dietary cautions",value:record.dietaryCautions}
 ]}/>;
}
/** Behavioural ecology is distinct from nutrition and can be compared separately. */
export function BehaviourEcologyWidget({record}:{record:SpeciesRecord}){
 return <Details title="Behaviour & Ecology" rows={[
  {label:"Defensive behaviour",value:record.defensiveBehaviour},
  {label:"Activity & visibility",value:record.visibilityNotes||record.activityNote},
  {label:"Bioactive suitability",value:record.bioactiveSuitability}
 ]}/>;
}
export function ResearchSourcesWidget({record}:{record:SpeciesRecord}){
 const lines=(record.researchSources||"").split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 const links=lines.filter(s=>{try{return ["https:","http:"].includes(new URL(s).protocol)}catch{return false}});
 if(!links.length&&!has(record,["evidenceScope","evidenceQuality","evidenceNotes","lastReviewed"]))return null;
 return <section className={styles.speciesInfoCard}><h2>Research &amp; Sources</h2>
 <dl className={styles.researchFacts}>
 {record.evidenceScope?<div><dt>Evidence scope</dt><dd>{{"species-level":"Species-level","morph-specific":"Morph-specific","mixed":"Mixed species and morph evidence"}[record.evidenceScope]||record.evidenceScope}</dd></div>:null}
 {record.evidenceQuality?<div><dt>Evidence basis</dt><dd>{{"scientific":"Scientific literature","breeder-consensus":"Breeder consensus","limited":"Limited evidence"}[record.evidenceQuality]||record.evidenceQuality}</dd></div>:null}
 {record.lastReviewed?<div><dt>Last reviewed</dt><dd>{record.lastReviewed}</dd></div>:null}
 {record.evidenceNotes?<div><dt>Evidence &amp; uncertainty</dt><dd>{record.evidenceNotes}</dd></div>:null}
 </dl>
 {links.length?<div className={styles.researchLinks}><strong>Original references</strong>{links.map((url,index)=><a key={url} href={url} target="_blank" rel="noopener noreferrer" title={url}>{index+1}. {new URL(url).hostname.replace(/^www\./,"")} ↗</a>)}</div>:null}
 <p className={styles.researchDisclaimer}>Seller consensus and scientific measurements are different evidence types. Species-level findings may not have been measured for a particular morph.</p>
 </section>;
}
export function HabitatSetupWidget({record}:{record:SpeciesRecord}){
 return <Details title="Habitat & Setup" rows={[
 {label:"Natural microhabitat",value:record.naturalMicrohabitat},
 {label:"Substrate composition",value:record.substrate},{label:"Substrate depth",value:record.substrateDepth},
 {label:"Enclosure guidance",value:record.enclosureGuidance}
 ]} note="Enclosure advice varies with colony size, ventilation and local conditions."/>;
}
