import type { Metadata } from "next";
import Link from "next/link";
import { PlatformShell } from "@/components/PlatformShell";
import { KeeperMobileNav } from "@/components/KeeperMobileNav";
import { getMemberCollectionState } from "@/lib/member-collection";
import { getSpeciesRecords } from "@/lib/species-store";
import { isSpeciesRecordActive, speciesDisplayName, speciesScientificName } from "@/data/species";
import { ColonyCsvImporter } from "./ColonyCsvImporter";
import styles from "./import.module.css";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Import Colonies | PodScape Manager",robots:{index:false,follow:false}};

export default async function KeeperImportPage(){
 const member=await getMemberCollectionState();
 const records=member.signedIn?await getSpeciesRecords():[];
 const species=records.filter(r=>r.kind==="species"&&isSpeciesRecordActive(r))
  .map(r=>({id:r.id,name:speciesDisplayName(r),scientific:speciesScientificName(r),morph:r.morph}))
  .sort((a,b)=>a.name.localeCompare(b.name));
 return <PlatformShell><main className={styles.page}><div className={styles.wrap}>
  <Link className={styles.back} href="/keeper/collection">← My Colonies</Link>
  <header className={styles.hero}><div><p>MANAGER · IMPORT STUDIO</p><h1>Bring your colonies</h1><span>Keep your existing records. Start using PodScape without entering every bin again.</span></div></header>
  {!member.signedIn?<section className={styles.panel}><h2>Your collection is private.</h2><p>Sign in to import your own colony records.</p><Link href="/account/login">Sign in →</Link></section>
    :<ColonyCsvImporter species={species}/>}
 </div></main>{member.signedIn?<KeeperMobileNav active="keeper"/>:null}</PlatformShell>;
}
