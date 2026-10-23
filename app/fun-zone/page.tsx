import type { Metadata } from "next";
import Link from "next/link";
import { PlatformShell } from "@/components/PlatformShell";
import { customerSupabase } from "@/lib/customer-auth/server";
import styles from "./fun-zone.module.css";
import { FunZoneCarousel } from "./FunZoneCarousel";
import { FunZoneLibrary } from "./FunZoneLibrary";

export const metadata: Metadata = { title: "Fun Zone | PodScape Labs", robots: {index:false,follow:false} };
export const dynamic = "force-dynamic";
export default async function FunZonePage(){
 const db=await customerSupabase();
 const {data:{user}}=db?await db.auth.getUser():{data:{user:null}};
 const {data:progress}=user&&db?await db.from("member_progress").select("total_exp,pod_coins").eq("user_id",user.id).maybeSingle():{data:null};
 return <PlatformShell><main className={styles.page}><div className={styles.wrap}>
  <header className={styles.heading}><div className={styles.heroCopy}><p className={styles.eyebrow}>PODSCAPE LABS / EXPLORE</p><h1>Fun Zone <span aria-hidden="true">✧</span></h1><p>Play, learn and explore. A little curiosity goes a long way.</p></div>
   <Link href={user?"/account/progress":"/account/login"} className={styles.balance} aria-label="View my progress"><span>✦ &nbsp;{user?Number(progress?.total_exp||0).toLocaleString("en-CA"):"—"} EXP</span><span>◉ &nbsp;{user?Number(progress?.pod_coins||0).toLocaleString("en-CA"):"—"} Pod Coins</span></Link></header>
  <FunZoneCarousel signedIn={Boolean(user)} exp={Number(progress?.total_exp||0)} coins={Number(progress?.pod_coins||0)}/>
  <FunZoneLibrary/>
 </div></main></PlatformShell>;
}
