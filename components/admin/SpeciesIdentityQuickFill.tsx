"use client";
import {useState} from "react";
import styles from "./SpeciesIdentityQuickFill.module.css";

const taxa:Record<string,string[]>={
 Porcellio:["laevis","scaber","dilatatus","hoffmannseggi","ornatus","expansus","bolivari","magnificus"],
 Porcellionides:["pruinosus","floria"],
 Armadillidium:["vulgare","maculatum","klugii","nasatum","granulatum","gestroi","peraccae"],
 Cubaris:["sp.","murina"],
 Trichorhina:["tomentosa"],
 Oniscus:["asellus"],
 Cylisticus:["convexus"],
 Asellus:["aquaticus"],
 Armadillo:["officinalis"]
};
const genera=Object.keys(taxa);
export function SpeciesIdentityQuickFill({initial}:{initial:{genus:string;species:string;scientificName:string;morph:string;commonName:string}}){
 const [genus,setGenus]=useState(initial.genus);
 const [species,setSpecies]=useState(initial.species);
 const [scientific,setScientific]=useState(initial.scientificName);
 const [morph,setMorph]=useState(initial.morph);
 const [common,setCommon]=useState(initial.commonName);
 const [notice,setNotice]=useState("");
 const setTaxon=(g:string,s:string)=>{
   setGenus(g);setSpecies(s);
   setScientific(g+" "+s);
   setNotice("Taxonomy fields filled. Review identification before saving.");
 };
 const applyScientific=()=>{if(!genus.trim()||!species.trim())return;setScientific(genus.trim()+" "+species.trim());setNotice("Scientific name assembled from the current fields.");};
 return <div className={styles.wrap}>
  <div className={styles.quick}><strong>Quick taxonomy</strong><span>Choose a genus and species to fill the identity fields. No care data is assumed.</span>
   <div className={styles.genusList}>{genera.map(g=><button type="button" key={g} className={genus===g?styles.active:""} onClick={()=>{setGenus(g);setSpecies("");setNotice("Genus selected. Choose or type the species.");}}>{g}</button>)}</div>
   {genus&&taxa[genus]?<div className={styles.speciesList}><span>Common {genus} entries</span><div>{taxa[genus].map(s=><button type="button" key={s} onClick={()=>setTaxon(genus,s)}>{s}</button>)}</div></div>:null}
  </div>
  <div className="admin-form-grid two">
   <label><span>Common name</span><input name="commonName" value={common} onChange={e=>setCommon(e.target.value)} placeholder="Leave blank until assigned"/></label>
   <label><span>Scientific name</span><input name="scientificName" value={scientific} onChange={e=>setScientific(e.target.value)} placeholder="Leave blank until assigned"/></label>
   <label><span>Genus</span><input name="genus" list="owner-genera" value={genus} onChange={e=>setGenus(e.target.value)}/><datalist id="owner-genera">{genera.map(g=><option value={g} key={g}/>)}</datalist></label>
   <label><span>Species</span><input name="species" value={species} onChange={e=>setSpecies(e.target.value)} list="owner-species"/><datalist id="owner-species">{(taxa[genus]||[]).map(s=><option value={s} key={s}/>)}</datalist></label>
   <label><span>Morph or variety</span><input name="morph" value={morph} onChange={e=>setMorph(e.target.value)}/></label>
  </div>
  <div className={styles.footer}><button type="button" onClick={applyScientific} disabled={!genus.trim()||!species.trim()}>Build scientific name ↗</button><small role="status">{notice||"Suggestions are shortcuts, not verified identifications. All fields remain editable."}</small></div>
 </div>;
}
