import type { Metadata } from "next";
import Link from "next/link";
import { PlatformShell } from "@/components/PlatformShell";
import { getMemberCollectionState } from "@/lib/member-collection";
import { listEnclosures } from "@/lib/keeper";
import { getSpeciesRecords } from "@/lib/species-store";
import { KeeperScanner } from "@/components/KeeperScanner";
import { KeeperMobileNav } from "@/components/KeeperMobileNav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Scan Bin | PodScape Keeper", robots: { index: false, follow: false } };

export default async function ScanPage({searchParams}:{searchParams:Promise<{bin?:string}>}) {
 const member = await getMemberCollectionState();
 if (!member.signedIn) return <PlatformShell><main className="v2-container" style={{padding:"48px 16px"}}><h1>Scan a bin</h1><p>Please <Link href="/account/login">sign in</Link> to manage your own bins.</p></main></PlatformShell>;
 let enclosures: Awaited<ReturnType<typeof listEnclosures>> = [];
 try { enclosures = (await listEnclosures()).filter(e=>!e.isArchived); } catch { return <PlatformShell><main className="v2-container" style={{padding:"48px 16px"}}><h1>Scan a bin</h1><p role="alert">Keeper storage is not available. Please check the customer database setup.</p></main></PlatformShell>; }
 const species = await getSpeciesRecords();
 const bins = enclosures.map(e=>{const record=species.find(s=>s.id===e.speciesId);return{id:e.id,name:e.name,label:e.label,quantity:e.quantity,species:record?.commonName||"Unlinked species",image:record?.image||null};});
 const requested = (await searchParams).bin || "";
 return <PlatformShell><main className="v2-container scan-page-active" style={{padding:"12px 16px 104px"}}><KeeperScanner bins={bins} initialBinId={requested}/></main><KeeperMobileNav active="scan"/></PlatformShell>;
}
