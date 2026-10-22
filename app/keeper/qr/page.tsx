import type { Metadata } from "next";
import Link from "next/link";
import { PlatformShell } from "@/components/PlatformShell";
import { KeeperMobileNav } from "@/components/KeeperMobileNav";
import { KeeperQrCreator } from "@/components/KeeperQrCreator";
import { getMemberCollectionState } from "@/lib/member-collection";
import { listEnclosures } from "@/lib/keeper";
import { getSpeciesRecords } from "@/lib/species-store";
import { speciesDisplayName } from "@/data/species";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Create QR | PodScape Labs", robots: { index: false, follow: false } };

export default async function CreateQrPage({ searchParams }: { searchParams: Promise<{ bin?: string }> }) {
 const member = await getMemberCollectionState();
 if (!member.signedIn) return <PlatformShell><main className="v2-container" style={{padding:"32px 16px"}}><h1>Create QR Code</h1><p><Link href="/account/login">Sign in</Link> to print labels for your bins.</p></main></PlatformShell>;
 let bins: Awaited<ReturnType<typeof listEnclosures>> = [];
 try { bins = (await listEnclosures()).filter(bin => !bin.isArchived); } catch { return <PlatformShell><main className="v2-container" style={{padding:"32px 16px"}}><p role="alert">Keeper bins are currently unavailable.</p></main></PlatformShell>; }
 const records = await getSpeciesRecords();
 const options = bins.map(bin => ({id:bin.id,name:bin.name,label:bin.label,species:records.find(record=>record.id===bin.speciesId) ? speciesDisplayName(records.find(record=>record.id===bin.speciesId)!) : "Unlinked species"}));
 const requested = (await searchParams).bin || "";
 return <PlatformShell><main className="v2-container keeper-qr-page" style={{padding:"18px 16px 112px"}}><KeeperQrCreator bins={options} initialBinId={requested}/></main><KeeperMobileNav active="keeper"/></PlatformShell>;
}
