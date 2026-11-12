import Link from "next/link";
import {PlatformShell} from "@/components/PlatformShell";
import {listPicturePuzzles,picturePuzzleImage,DIFFICULTIES,PUZZLE_TYPES,levelLabel,gridDescription} from "@/lib/picture-puzzles";
import styles from "./picture-puzzles.module.css";
export const dynamic="force-dynamic";
export const metadata={title:"Picture Puzzles | PodScape Fun Zone",robots:{index:false,follow:false}};
export default async function PicturePuzzlesPage(){
 const puzzles=await listPicturePuzzles();
 return <PlatformShell><main className={styles.page}><div className={styles.wrap}>
  <Link className={styles.back} href="/fun-zone">← Fun Zone</Link>
  <header className={styles.hero}><span>FUN ZONE / PICTURE PUZZLES</span><h1>Piece by piece.</h1><p>Rebuild beautiful PodBound artwork and photos from the little world of isopods. Choose a jigsaw-style picture assembly or a classic sliding puzzle.</p></header>
  {puzzles===null?<p role="status" className={styles.empty}>Picture puzzles are not configured yet.</p>:null}
  <div className={styles.library}>{(puzzles||[]).map(p=><Link key={p.id} href={`/fun-zone/picture-puzzles/${p.id}`} className={styles.card}><div className={styles.cover} style={{backgroundImage:`url("${picturePuzzleImage(p.image_path)}")`}}/><div className={styles.copy}><span>{PUZZLE_TYPES[p.puzzle_type]||"Jigsaw"} · {levelLabel(p.level)} · {DIFFICULTIES[p.difficulty]?.label} · {gridDescription(p.puzzle_type,p.difficulty)}</span><h2>{p.title}</h2><p>{p.description||"Put the image back together."}</p>{p.learning_note?<p>{p.learning_note}</p>:null}<strong>Play puzzle →</strong></div></Link>)}{puzzles?.length===0?<p className={styles.empty}>The first puzzle is being prepared. Check back soon!</p>:null}</div>
 </div></main></PlatformShell>;
}
