import {speciesResearchGroups} from "@/lib/species-research-fields";
import type {SpeciesRecord} from "@/data/species";
import styles from "@/app/admin/species/ledger-desk.module.css";

/** Research is optional and never auto-filled. Sources should be mapped to specific claims. */
export function SpeciesResearchEditor({record}:{record:SpeciesRecord}){
 return <section className={styles.researchEditor} aria-label="Optional researched species information">
  <div className={styles.researchEditorIntro}>
   <strong>Research &amp; specialist details</strong>
   <p>Optional verified information for advanced widgets. Leave unknown values blank, and cite the original source beside each claim in Evidence notes. Good starting references include scientific publications, taxonomic databases, independent breeders and isopod.site.</p>
  </div>
  {speciesResearchGroups.map(group=><details key={group.id} className={styles.researchGroup}>
   <summary>{group.title}<span>{group.fields.filter(([name])=>Boolean(record[name]?.trim())).length} filled</span></summary>
   <div className={styles.researchGrid}>{group.fields.map(([name,label,limit])=>{
    const value=record[name]||"";
    const long=limit>200;
    if(name==="evidenceScope")return <label key={name}><span>{label}</span><select name={name} defaultValue={value}><option value="">Not recorded</option><option value="species-level">Species-level</option><option value="morph-specific">Morph-specific</option><option value="mixed">Mixed / varies by field</option></select></label>;
    if(name==="evidenceQuality")return <label key={name}><span>{label}</span><select name={name} defaultValue={value}><option value="">Not recorded</option><option value="scientific">Scientific evidence</option><option value="breeder-consensus">Breeder consensus</option><option value="limited">Limited evidence</option></select></label>;
    return <label key={name}><span>{label}</span>{long
      ?<textarea name={name} rows={name==="researchSources"||name==="evidenceNotes"?5:3} maxLength={limit} defaultValue={value} placeholder={name==="researchSources"?"https://isopod.site/…\nhttps://…":name==="evidenceNotes"?"Field → source URL / author → applies to species or morph → uncertainty":undefined}/>
      :<input name={name} maxLength={limit} defaultValue={value} inputMode={["humidityMin","humidityMax","moistZoneCoverage","broodAverage","broodMin","broodMax","adultSizeMm"].includes(name)?"decimal":undefined} placeholder={name==="lastReviewed"?"YYYY-MM-DD":undefined}/>}
    </label>;
   })}</div>
  </details>)}
 </section>;
}
