import type {Metadata} from "next";
import Link from "next/link";
import {PlatformShell} from "@/components/PlatformShell";
import {KeeperMobileNav} from "@/components/KeeperMobileNav";
import {getMemberCollectionState} from "@/lib/member-collection";
import {getSpeciesRecords} from "@/lib/species-store";
import {isSpeciesRecordActive,speciesDisplayName,speciesScientificName} from "@/data/species";
import {listEnclosures} from "@/lib/keeper";
import {NewBinForm} from "./NewBinForm";
import styles from "./page.module.css";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Add Bin | PodScape Manager",robots:{index:false,follow:false}};

export default async function NewBinPage({searchParams}:{searchParams:Promise<{species?:string}>}){
 const member=await getMemberCollectionState();
 const selectedSpecies=(await searchParams).species||"";
 let species:{id:string;name:string;scientific:string;existingNames:string[]}[]=[];
 let unavailable=false;
 if(member.signedIn){
  try{
   const [records,bins]=await Promise.all([getSpeciesRecords(),listEnclosures()]);
   species=records.filter(record=>record.kind==="species"&&isSpeciesRecordActive(record)&&record.status==="published")
    .map(record=>({id:record.id,name:speciesDisplayName(record),scientific:speciesScientificName(record),existingNames:bins.filter(bin=>bin.speciesId===record.id).map(bin=>bin.name)}))
    .sort((a,b)=>a.name.localeCompare(b.name));
  }catch{unavailable=true;}
 }
 return <PlatformShell>
  <main className={styles.page}><div className={styles.inner}>
   <Link className={styles.back} href="/keeper">← Manager Dashboard</Link>
   <header className={styles.header}><p>MANAGER / NEW ENCLOSURE</p><h1>Add a bin</h1><span>Choose a species and name the enclosure. Creating a bin also saves that species in My Collection.</span></header>
   {!member.signedIn?<div className={styles.empty}><h2>Your bins are private.</h2><p>Sign in to create and manage your own colonies.</p><Link href="/account/login">Sign in →</Link></div>
    :unavailable?<div className={styles.empty} role="alert"><h2>Species are temporarily unavailable.</h2><p>Try again when the Leaf Ledger connection is available.</p></div>
    :species.length?<NewBinForm species={species} initialSpeciesId={selectedSpecies}/>
    :<div className={styles.empty}><h2>Choose your first species</h2><p>Discover a published species in Leaf Ledger, then return to create its first bin.</p><Link href="/ledger">Explore Leaf Ledger →</Link></div>}
  </div></main>
  {member.signedIn?<KeeperMobileNav active="keeper"/>:null}
 </PlatformShell>;
}
