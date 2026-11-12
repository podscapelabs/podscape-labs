import Link from "next/link";
import {PlatformShell} from "@/components/PlatformShell";
import {customerSupabase} from "@/lib/customer-auth/server";
import {listPicturePuzzles,picturePuzzleImage,DIFFICULTIES,PUZZLE_TYPES,levelLabel,gridDescription} from "@/lib/picture-puzzles";
import styles from "./picture-puzzles.module.css";
export const dynamic="force-dynamic";
export const metadata={title:"Picture Puzzles | PodScape Fun Zone",robots:{index:false,follow:false}};
export default async function PicturePuzzlesPage(){
 const puzzles=await listPicturePuzzles();
 const db=await customerSupabase();
 const {data:{user}}=db?await db.auth.getUser():{data:{user:null}};
 const result=db&&user?await db.from("member_puzzle_completions").select("puzzle_id").eq("user_id",user.id).eq("game_key","picture-puzzles"):null;
 const completed=new Set((result?.data||[]).map(row=>String(row.puzzle_id)));
 const available=Boolean(user&&result&&!result.error);
 return <PlatformShell><main className={styles.page}><div className={styles.wrap}>
  <Link className={styles.back} href="/fun-zone">← Fun Zone</Link>
  <header className={styles.hero}><span>FUN ZONE / PICTURE PUZZLES</span><h1>Piece by piece.</h1><p>Rebuild PodBound artwork and isopod photos with genuine jigsaw pieces or sliding tiles.</p></header>
  {puzzles===null?<p role="status" className={styles.empty}>Picture puzzles are not configured yet.</p>:null}
  {available?<p className={styles.empty}>{(puzzles||[]).filter(p=>completed.has(p.id)).length} / {puzzles?.length||0} puzzles completed · Unique first-time completions count toward Fun Zone achievements.</p>:<p className={styles.empty}>Sign in with an approved account to save puzzle completion and earn achievements.</p>}
  <div className={styles.library}>{(puzzles||[]).map((p,index)=>{
   const done=completed.has(p.id);
   const ready=available&&(done||index===0||completed.has((puzzles||[])[index-1].id));
   return <article key={p.id} className={styles.card}>
    <div className={styles.cover} role="img" aria-label={p.image_alt||p.title} style={{backgroundImage:`url("${picturePuzzleImage(p.image_path)}")`}}/>
    <div className={styles.copy}><span>{PUZZLE_TYPES[p.puzzle_type]||"Jigsaw"} · {levelLabel(p.level)} · {DIFFICULTIES[p.difficulty]?.label} · {gridDescription(p.puzzle_type,p.difficulty)}</span>
     <h2>{p.title}</h2><p>{p.description||"Put the image back together."}</p>
     {p.learning_note?<p>{p.learning_note}</p>:null}
     {ready?<Link href={`/fun-zone/picture-puzzles/${p.id}`}><strong>{done?"Replay puzzle →":"Play puzzle →"}</strong></Link>:<strong>{available?"Locked · Complete the previous puzzle":"Sign in to play"}</strong>}
    </div>
   </article>;
  })}{puzzles?.length===0?<p className={styles.empty}>The first puzzle is being prepared. Check back soon!</p>:null}</div>
 </div></main></PlatformShell>;
}
