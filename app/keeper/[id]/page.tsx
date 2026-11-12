import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {PlatformShell} from "@/components/PlatformShell";
import {KeeperMobileNav} from "@/components/KeeperMobileNav";
import {getEnclosure,listQuickCareDates,keeperContext,listEnclosures} from "@/lib/keeper";
import {getSpeciesRecords} from "@/lib/species-store";
import {speciesDisplayName} from "@/data/species";
import {ColonyWorkspace} from "./ColonyWorkspace";
import styles from "./ColonyWorkspace.module.css";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Colony Workspace | PodScape Manager",robots:{index:false,follow:false}};

/** All routes to a bin land on the same signed-in, privately owned colony record. */
export default async function EnclosurePage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{panel?:string;created?:string}>}){
 const {id}=await params;
 const options=await searchParams;
 const panel=options.panel==="observation"?"observation":undefined;
 if(!/^[a-f0-9-]{36}$/i.test(id))notFound();
 const data=await getEnclosure(id);
 if(!data)notFound();
 const {enclosure,events}=data;
 let navigationBins:Awaited<ReturnType<typeof listEnclosures>>=[];
 try{navigationBins=(await listEnclosures()).filter(bin=>!bin.isArchived);}catch{/* Navigation is optional when the list is unavailable. */}
 const {user}=await keeperContext();
 let careDates:Record<string,string>={};
 try{careDates=(await listQuickCareDates([id]))[id]||{};}catch{/* The workspace stays available if summary dates cannot load. */}
 const species=await getSpeciesRecords();
 const record=species.find(item=>item.id===enclosure.speciesId);
 return <PlatformShell><main className={styles.page}>
  <ColonyWorkspace key={enclosure.id}
   colony={{id:enclosure.id,name:enclosure.name,speciesId:enclosure.speciesId,label:enclosure.label,species:record?speciesDisplayName(record):"Unlinked species",image:record?.image||null,status:enclosure.status,breeding:enclosure.breeding,quantity:enclosure.quantity,archived:enclosure.isArchived,enclosureType:enclosure.enclosureType}}
   created={options.created==="1"}
   scope={user?.id||"guest"}
   navigationBins={navigationBins.map(({id,name,speciesId,label})=>({id,name,speciesId,label,species:species.find(record=>record.id===speciesId)?speciesDisplayName(species.find(record=>record.id===speciesId)!):"Unlinked species"}))}
   initialEvents={events}
   careDates={careDates}
   initialPanel={panel}
   referenceUrl={record?"/ledger/"+record.slug:undefined}
  />
 </main><KeeperMobileNav active="keeper"/></PlatformShell>;
}
