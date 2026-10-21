import type { Metadata } from "next";
import Link from "next/link";
import { PlatformShell, Breadcrumbs } from "@/components/PlatformShell";
import { getMemberCollectionState } from "@/lib/member-collection";
import { listEnclosures } from "@/lib/keeper";
import { getSpeciesRecords } from "@/lib/species-store";
import { KeeperCareSchedule } from "@/components/KeeperCareSchedule";
import { KeeperMobileNav } from "@/components/KeeperMobileNav";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Care Schedule | PodScape Keeper",robots:{index:false,follow:false}};
export default async function SchedulePage(){
 const member=await getMemberCollectionState();
 if(!member.signedIn)return <PlatformShell><main className="v2-container" style={{padding:"40px 16px"}}><h1>Care schedule</h1><p><Link href="/account/login">Sign in</Link> to view your bins.</p></main></PlatformShell>;
 let enclosures:Awaited<ReturnType<typeof listEnclosures>>=[];
 try{enclosures=await listEnclosures();}catch{return <PlatformShell><main className="v2-container" style={{padding:"40px 16px"}}><h1>Care schedule</h1><p role="alert">Keeper storage is unavailable.</p></main></PlatformShell>;}
 const species=await getSpeciesRecords();
 const bins=enclosures.filter(e=>!e.isArchived).map(e=>({id:e.id,name:e.name,species:species.find(x=>x.id===e.speciesId)?.commonName||"Species",label:e.label}));
 return <PlatformShell><main className="v2-container" style={{padding:"20px 16px 110px"}}><Breadcrumbs items={[{label:"My Collection",href:"/ledger/my-collection"},{label:"Keeper",href:"/keeper"},{label:"Care schedule"}]}/><KeeperCareSchedule bins={bins}/></main><KeeperMobileNav active="keeper"/></PlatformShell>;
}
