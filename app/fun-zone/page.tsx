import type { Metadata } from "next";
import Link from "next/link";
import { PlatformShell } from "@/components/PlatformShell";
import { customerSupabase } from "@/lib/customer-auth/server";
import styles from "./fun-zone.module.css";
import {WorkspaceHeader} from "@/components/PodscapeWorkspaceUI";
import { FunZoneCarousel } from "./FunZoneCarousel";
import { FunZoneLibrary } from "./FunZoneLibrary";

export const metadata: Metadata = { title: "Fun Zone | PodScape Labs", robots: {index:false,follow:false} };
export const dynamic = "force-dynamic";
export default async function FunZonePage(){
 const db=await customerSupabase();
 const {data:{user}}=db?await db.auth.getUser():{data:{user:null}};
 const [progressResult,completionsResult]=user&&db?await Promise.all([
  db.from("member_progress").select("total_exp,pod_coins").eq("user_id",user.id).maybeSingle(),
  db.from("member_puzzle_completions").select("game_key,puzzle_id").eq("user_id",user.id)
 ]):[{data:null},{data:null,error:null}];
 const progress=progressResult.data;
 const counts:Record<string,number>={};
 for(const row of completionsResult.data||[])counts[row.game_key]=(counts[row.game_key]||0)+1;
 return <PlatformShell><main className={styles.page}><div className={styles.wrap}>
  <WorkspaceHeader section="PODSCAPE / PLAY" title="Fun Zone" description="Your little corner for puzzles and play." aside={<Link href={user?"/account/progress":"/account/login"} className={styles.balance} aria-label="View my progress"><span>✦ &nbsp;{user?Number(progress?.total_exp||0).toLocaleString("en-CA"):"—"} EXP</span><span>◉ &nbsp;{user?Number(progress?.pod_coins||0).toLocaleString("en-CA"):"—"} Pod Coins</span></Link>}/>
  <FunZoneCarousel signedIn={Boolean(user)} exp={Number(progress?.total_exp||0)} coins={Number(progress?.pod_coins||0)}/>
  <FunZoneLibrary completedByGame={counts} trackingAvailable={!completionsResult.error&&Boolean(user)}/>
 </div></main></PlatformShell>;
}
