import type {Metadata} from "next";
import Link from "next/link";
import {PlatformShell} from "@/components/PlatformShell";
import {KeeperMobileNav} from "@/components/KeeperMobileNav";
import {listManagerActivity} from "@/lib/keeper";
import {getMemberCollectionState} from "@/lib/member-collection";
import {ManagerActivityHistory} from "@/components/ManagerActivityHistory";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Care Activity | PodScape Manager",robots:{index:false,follow:false}};
export default async function ActivityPage(){
 const member=await getMemberCollectionState();
 if(!member.signedIn)return <PlatformShell><main className="v2-container" style={{padding:"36px 16px 100px"}}><h1>Care activity</h1><p><Link href="/account/login">Sign in</Link> to see your private care history.</p></main></PlatformShell>;
 let events:Awaited<ReturnType<typeof listManagerActivity>>=[];
 let unavailable=false;
 try{events=await listManagerActivity(30);}catch{unavailable=true;}
 return <PlatformShell><main className="v2-container" style={{padding:"24px 16px 110px"}}>
  <p style={{fontSize:".72rem"}}><Link href="/keeper">← Back to Manager</Link></p>
  <ManagerActivityHistory events={events} unavailable={unavailable}/>
 </main><KeeperMobileNav active="keeper"/></PlatformShell>;
}
