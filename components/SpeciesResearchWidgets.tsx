"use client";

import {useEffect,useId,useRef,useState,type ReactNode} from "react";
import type {SpeciesRecord} from "@/data/species";
import styles from "@/components/SpeciesProfile.module.css";

function has(record:SpeciesRecord,keys:(keyof SpeciesRecord)[]){return keys.some(k=>typeof record[k]==="string"&&Boolean((record[k] as string).trim()));}
/** Native dialog keeps full editorial records one tap away from the compact dashboard. */
function ResearchDialog({title,preview,children}:{title:string;preview:ReactNode;children:ReactNode}){
 const dialogRef=useRef<HTMLDialogElement>(null);
 const titleId=useId();
 const [open,setOpen]=useState(false);
 useEffect(()=>{
  const dialog=dialogRef.current;
  if(!dialog)return;
  if(open&&!dialog.open)dialog.showModal();
  else if(!open&&dialog.open)dialog.close();
 },[open]);
 return <>
  <button className={styles.researchCardTrigger} type="button" onClick={()=>setOpen(true)} aria-label={"Explore "+title}>
   {preview}
   <span className={styles.researchOpenButton}><span>Explore details</span><span aria-hidden="true">↗</span></span>
  </button>
  <dialog ref={dialogRef} aria-labelledby={titleId} className={styles.researchDialog}
   onClose={()=>setOpen(false)}
   onClick={event=>{if(event.target===event.currentTarget)dialogRef.current?.close()}}>
   <div className={styles.researchDialogPanel}>
    <div className={styles.researchDialogHeader}>
     <div><small>LEAF LEDGER · SPECIES RESEARCH</small><h2 id={titleId}>{title}</h2></div>
     <button type="button" className={styles.researchDialogClose} onClick={()=>dialogRef.current?.close()} aria-label={"Close "+title}>×</button>
    </div>
    <div className={styles.researchDialogBody}>{children}</div>
   </div>
  </dialog>
 </>;
}
/** Dashboard previews end on word boundaries. The detail sheet always has the full value. */
function previewFact(label:string,value:string){
 const clean=value.replace(/\s+/g," ").trim();
 const primary=label==="Staple diet"?clean.split(/[;,]/)[0]:clean;
 if(primary.length<=88)return primary;
 const boundary=primary.lastIndexOf(" ",86);
 return primary.slice(0,boundary>45?boundary:86).replace(/[\s,;:]+$/,"")+"…";
}
function Details({title,rows,note}:{title:string;rows:{label:string;value:string|undefined}[];note?:string}){
 const active=rows.filter((r):r is {label:string;value:string}=>Boolean(r.value?.trim()));
 if(!active.length)return null;
 return <ResearchDialog title={title} preview={<div className={styles.speciesInfoCard+" "+styles.researchOverview}>
  <h2>{title}</h2>
  <dl className={styles.researchSnapshot}>
   {active.slice(0,4).map(row=><div key={row.label}>
    <dt>{row.label}</dt><dd>{previewFact(row.label,row.value)}</dd>
   </div>)}
  </dl>
 </div>}>
   <dl className={styles.researchFullFacts}>{active.map(row=><div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>
   {note?<div className={styles.researchExpandedNote}><strong>Research context</strong><p>{note}</p></div>:null}
  </ResearchDialog>;
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
const shortMoistureZones=["Drier","Lightly damp","Moderate","Moist","Very moist"];
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
  ? start===end?shortMoistureZones[start-1]:shortMoistureZones[start-1]+" – "+shortMoistureZones[end-1]
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
 return <Details title="Breeding & Growth" rows={[
  {label:"Average brood",value:avg?avg+" young":undefined},
  {label:"Observed brood range",value:min&&max?min+"–"+max+" young":undefined},
  {label:"Incubation / brooding",value:record.incubationPeriod},{label:"Age at maturity",value:record.maturityAge},
  {label:"Breeding season",value:record.breedingSeason}
 ]} note={has(record,["broodAverage","broodMin","broodMax"])?"Brood measurements depend on the studied population and conditions. Check Research & Sources for evidence scope.":undefined}/>;
}
export function TaxonomyOriginWidget({record}:{record:SpeciesRecord}){
 return <Details title="Origins & Identity" rows={[
 {label:"Native distribution",value:record.nativeDistribution},
 {label:"Morph origin",value:record.morphOrigin},
 {label:"Taxonomic status",value:record.taxonomicStatus},
 {label:"Synonyms",value:record.taxonomicSynonyms},
 {label:"Identification & lookalikes",value:record.identificationNotes}
 ]}/>;
}
export function FeedingEcologyWidget({record}:{record:SpeciesRecord}){
 return <Details title="Feeding & Nutrition" rows={[
 {label:"Staple diet",value:record.stapleDiet||record.feeding},{label:"Protein",value:record.proteinGuidance},{label:"Calcium",value:record.calciumGuidance},
 {label:"Dietary cautions",value:record.dietaryCautions}
 ]}/>;
}
/** Individual morphology and behaviour belong together, not inside the taxonomy card. */
export function BehaviourEcologyWidget({record}:{record:SpeciesRecord}){
 return <Details title="Species Characteristics" rows={[
 {label:"Adult size",value:record.adultSizeMm?.trim()?record.adultSizeMm+" mm":undefined},
 {label:"Lifespan",value:record.lifespan},
 {label:"Defensive behaviour",value:record.defensiveBehaviour},
 {label:"Activity & visibility",value:record.visibilityNotes||record.activityNote}
 ]}/>;
}
export function ResearchSourcesWidget({record}:{record:SpeciesRecord}){
 const lines=(record.researchSources||"").split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 const links=lines.filter(s=>{try{return ["https:","http:"].includes(new URL(s).protocol)}catch{return false}});
 if(!links.length&&!has(record,["evidenceScope","evidenceQuality","evidenceNotes","lastReviewed"]))return null;
 const review=record.lastReviewed?new Date(record.lastReviewed+"T00:00:00").toLocaleDateString("en-CA",{month:"short",year:"numeric"}):null;
 return <ResearchDialog title="Research & Sources" preview={<div className={styles.speciesInfoCard+" "+styles.researchOverview}>
  <h2>Research &amp; Sources</h2>
  <div className={styles.researchSourcesSummary}>
   <span>{links.length} reference{links.length===1?"":"s"}</span>
   {review?<span>Reviewed {review}</span>:null}
  </div>
 </div>}>
   <dl className={styles.researchFullFacts}>
    {record.evidenceScope?<div><dt>Evidence scope</dt><dd>{{"species-level":"Species-level","morph-specific":"Morph-specific","mixed":"Mixed species and morph evidence"}[record.evidenceScope]||record.evidenceScope}</dd></div>:null}
    {record.evidenceQuality?<div><dt>Evidence basis</dt><dd>{{"scientific":"Scientific literature","breeder-consensus":"Breeder consensus","limited":"Limited evidence"}[record.evidenceQuality]||record.evidenceQuality}</dd></div>:null}
    {record.lastReviewed?<div><dt>Last reviewed</dt><dd>{record.lastReviewed}</dd></div>:null}
    {record.evidenceNotes?<div><dt>Evidence &amp; uncertainty</dt><dd>{record.evidenceNotes}</dd></div>:null}
   </dl>
   {links.length?<div className={styles.researchDialogLinks}><strong>Original references</strong><div className={styles.researchLinks}>{links.map((url,index)=><a key={url} href={url} target="_blank" rel="noopener noreferrer" title={url}>{index+1}. {new URL(url).hostname.replace(/^www\./,"")} ↗</a>)}</div></div>:null}
   <div className={styles.researchExpandedNote}><strong>About this evidence</strong><p>Scientific measurements and captive-care consensus are different evidence types. Findings for a named species may not have been directly tested for every hobby morph.</p></div>
  </ResearchDialog>;
}
export function HabitatSetupWidget({record}:{record:SpeciesRecord}){
 return <Details title="Habitat & Setup" rows={[
 {label:"Ventilation",value:record.ventilation},
 {label:"Substrate",value:record.substrate},
 {label:"Substrate depth",value:record.substrateDepth},
 {label:"Enclosure guidance",value:record.enclosureGuidance},
 {label:"Natural microhabitat",value:record.naturalMicrohabitat},
 {label:"Bioactive suitability",value:record.bioactiveSuitability}
 ]} note="Enclosure advice varies with colony size, ventilation and local conditions."/>;
}
