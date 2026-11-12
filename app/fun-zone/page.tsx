import type { Metadata } from "next";
import { PlatformShell } from "@/components/PlatformShell";
import { customerSupabase } from "@/lib/customer-auth/server";
import styles from "./fun-zone.module.css";
import { FunZonePortal } from "./FunZonePortal";

export const metadata: Metadata = { title: "Fun Zone | PodScape Labs", robots: {index:false,follow:false} };
export const dynamic = "force-dynamic";
export default async function FunZonePage(){
 const db=await customerSupabase();
 const {data:{user}}=db?await db.auth.getUser():{data:{user:null}};
 let progress:{total_exp:number}|null=null;
 let trackingAvailable=false;
 const counts:Record<string,number>={};
 if(user&&db){
  const [progressResult,completionsResult]=await Promise.all([
   db.from("member_progress").select("total_exp").eq("user_id",user.id).maybeSingle(),
   db.from("member_puzzle_completions").select("game_key,puzzle_id").eq("user_id",user.id)
  ]);
  progress=progressResult.data;
  trackingAvailable=!completionsResult.error;
  for(const row of completionsResult.data||[])counts[row.game_key]=(counts[row.game_key]||0)+1;
 }
 return <PlatformShell><main className={styles.page}><div className={styles.wrap}>
  <FunZonePortal userId={user?.id||null} completedByGame={counts} trackingAvailable={trackingAvailable} exp={Number(progress?.total_exp||0)}/>
 </div></main></PlatformShell>;
}
