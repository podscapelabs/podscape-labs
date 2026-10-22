import Link from "next/link";
import { redirect } from "next/navigation";
import { customerSupabase } from "@/lib/customer-auth/server";
import styles from "../account-dashboard.module.css";

export const dynamic = "force-dynamic";
const quests = [
 { title:"Explore the Ledger", description:"Discover a species you have not read about yet.", destination:"/ledger", label:"Explore species" },
 { title:"Learn something new", description:"Browse a keeper guide and build your knowledge.", destination:"/field-guide", label:"Read guides" },
 { title:"Meet the community", description:"Explore the creative people behind PodScape.", destination:"/creative-network", label:"Discover creators" },
];
export default async function ProgressPage() {
 const db = await customerSupabase();
 if (!db) redirect("/account/login");
 const {data:{user}} = await db.auth.getUser();
 if (!user) redirect("/account/login");
 const {data:progress} = await db.from("member_progress").select("total_exp,pod_coins").eq("user_id",user.id).maybeSingle();
 const exp = Number(progress?.total_exp || 0);
 const level = Math.floor(Math.sqrt(exp/100))+1;
 return <main className={styles.page}><div className={styles.inner}>
  <header className={styles.hero}><p className={styles.eyebrow}>PODSCAPE LABS / MEMBER PROGRESS</p><h1>My Progress</h1><p>A little recognition for exploring the world of isopods.</p></header>
  <p><Link href="/account">← Back to My Account</Link></p>
  <section className={styles.progress}><div className={styles.progressHeading}><span>✧</span><h2>Level {level}</h2></div><p>{exp.toLocaleString("en-CA")} lifetime EXP · {Number(progress?.pod_coins || 0).toLocaleString("en-CA")} Pod Coins</p><p>EXP is permanent. Pod Coins will unlock future platform rewards.</p></section>
  <section className={styles.activity}><h2>Quest Board</h2><p>Discover ways to use PodScape. Quests are previews while automatic completion and EXP awards are being connected.</p>
  {quests.map(quest=><article key={quest.title} style={{padding:"16px 0",borderTop:"1px solid var(--line)"}}><h3 style={{margin:"0 0 5px",fontFamily:"Georgia,serif"}}>{quest.title}</h3><p>{quest.description}</p><Link href={quest.destination}>{quest.label} →</Link></article>)}</section>
  <section className={styles.activity}><h2>Achievements &amp; Rewards</h2><p>Milestones, Pod Coin rewards and achievements will appear here as the program rolls out. No quests are awarding EXP yet.</p></section>
 </div></main>;
}
