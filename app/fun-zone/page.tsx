import type { Metadata } from "next";
import Link from "next/link";
import { PlatformShell } from "@/components/PlatformShell";
import { customerSupabase } from "@/lib/customer-auth/server";
import styles from "./fun-zone.module.css";
export const metadata: Metadata = { title: "Fun Zone | PodScape Labs", robots:{index:false,follow:false} };
export const dynamic = "force-dynamic";
const activities = [
 {icon:"◈",title:"Word of the Week",detail:"Discover a new isopod term.",status:"Coming soon"},
 {icon:"?",title:"Species Quiz",detail:"Test what you know.",status:"Coming soon"},
 {icon:"⌕",title:"Word Search",detail:"Find hidden hobby terms.",status:"Coming soon"},
 {icon:"▦",title:"Crossword",detail:"A little puzzle break.",status:"Coming soon"}
];
export default async function FunZonePage(){
 const db=await customerSupabase();
 const {data:{user}}=db?await db.auth.getUser():{data:{user:null}};
 const {data:progress}=user&&db?await db.from("member_progress").select("total_exp,pod_coins").eq("user_id",user.id).maybeSingle():{data:null};
 return <PlatformShell><main className={styles.page}><div className={styles.wrap}>
 <header className={styles.heading}><div><p className={styles.eyebrow}>PODSCAPE LABS / EXPLORE</p><h1>Fun Zone <span aria-hidden="true">✧</span></h1><p>Play, learn and explore. A little curiosity goes a long way.</p></div>
 <Link href={user?"/account/progress":"/account/login"} className={styles.balance}><span>✦ &nbsp;{user?Number(progress?.total_exp||0).toLocaleString("en-CA"):"—"} EXP</span><span>◉ &nbsp;{user?Number(progress?.pod_coins||0).toLocaleString("en-CA"):"—"} Pod Coins</span></Link></header>
 <section className={styles.wheel}><div><p className={styles.eyebrow}>DAILY REWARD · COMING SOON</p><h2>The Daily Pod Wheel</h2><p>A little daily surprise for PodScape members. Free spins and coin rewards are in development.</p><span className={styles.pill}>Wheel opening soon</span></div><div className={styles.wheelGraphic} aria-hidden="true"><div className={styles.wheelCenter}>✦</div></div></section>
 <div className={styles.sectionHeading}><h2>Activities</h2><span>More activities on the way</span></div>
 <section className={styles.activities} aria-label="Fun Zone activities">{activities.map(a=><article className={styles.activity} key={a.title}><span className={styles.icon} aria-hidden="true">{a.icon}</span><h3>{a.title}</h3><p>{a.detail}</p><span className={styles.status}>{a.status}</span></article>)}</section>
 <section className={styles.lower}><article className={styles.panel}><div className={styles.panelTop}><span className={styles.icon} aria-hidden="true">♧</span><div><h3>Monthly Milestones</h3><p>Complete activities and collect rewards at your own pace.</p></div></div><div className={styles.track}><span /></div><small>Activities and progress tracking coming soon</small></article><article className={styles.panel}><div className={styles.panelTop}><span className={styles.icon} aria-hidden="true">☆</span><div><h3>Featured Challenge</h3><p>Something new to discover each week.</p></div></div><span className={styles.status}>Coming soon</span></article></section>
 <section className={styles.footer}><h2>Keep exploring</h2><div><Link href="/ledger">Explore the Ledger <span>↗</span></Link><Link href="/field-guide">Read the Field Guide <span>↗</span></Link><Link href="/account/progress">My Achievements <span>↗</span></Link></div></section>
 </div></main></PlatformShell>;
}
