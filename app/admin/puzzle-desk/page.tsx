import Link from "next/link";
import {redirect} from "next/navigation";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {DIFFICULTIES,listPicturePuzzles,picturePuzzleImage} from "@/lib/picture-puzzles";
import {createPicturePuzzle,setPicturePuzzleStatus} from "./actions";
import styles from "./puzzle-desk.module.css";
export const dynamic="force-dynamic";
export const metadata={title:"Puzzle Desk | PodScape Owner Studio",robots:{index:false,follow:false}};
export default async function PuzzleDesk({searchParams}:{searchParams:Promise<{saved?:string;error?:string}>}){
 if(!await isAdminAuthenticated())redirect("/admin");
 const [puzzles,params]=await Promise.all([listPicturePuzzles(true),searchParams]);
 return <main className={styles.page}><div className={styles.wrap}>
  <Link href="/account/owner-tools" className={styles.back}>← Owner Studio</Link>
  <header className={styles.hero}><span>OWNER STUDIO / FUN ZONE</span><h1>Puzzle Desk</h1><p>Turn your PodBound artwork and isopod photos into playable mobile picture puzzles.</p></header>
  {params.saved?<p role="status" className={styles.notice}>Puzzle saved as {params.saved}.</p>:null}
  {params.error?<p role="alert" className={styles.alert}>Could not save the puzzle. Check the image, database migration, and storage bucket. JPEG, PNG or WebP up to 8 MB.</p>:null}
  {puzzles===null?<p role="alert" className={styles.alert}>Puzzle storage is not ready. Apply the picture-puzzles migration before publishing.</p>:null}
  <section className={styles.card}><div className={styles.heading}><span>CREATE</span><h2>New picture puzzle</h2><p>Upload a photo, set its difficulty, and save it as a private draft. Publish only when it looks right.</p></div>
  <form action={createPicturePuzzle} className={styles.form}>
   <label>Title<input name="title" required minLength={3} maxLength={90} placeholder="Rubber Ducky — PodBound artwork"/></label>
   <label>Description<textarea name="description" maxLength={240} rows={2} placeholder="Piece the scene back together."/></label>
   <label>Difficulty<select name="difficulty" defaultValue="easy">{Object.entries(DIFFICULTIES).map(([key,value])=><option key={key} value={key}>{value.label} · {value.rows*value.columns} pieces</option>)}</select></label>
   <label>Artwork <small>JPEG, PNG or WebP · Max 8 MB · Use artwork you own or are licensed to publish</small><input name="image" type="file" accept="image/png,image/jpeg,image/webp" required/></label>
   <button type="submit">Create draft puzzle →</button>
  </form></section>
  <section className={styles.card}><div className={styles.heading}><span>LIBRARY</span><h2>Manage puzzles</h2><p>{puzzles?.length||0} puzzles · {puzzles?.filter(p=>p.status==="published").length||0} published</p></div>
   <div className={styles.list}>{(puzzles||[]).map(p=><article key={p.id} className={styles.item}>
    <div className={styles.art} style={{backgroundImage:`url("${picturePuzzleImage(p.image_path)}")`}} aria-label={p.title} role="img"/>
    <div className={styles.itemInfo}><strong>{p.title}</strong><small>{DIFFICULTIES[p.difficulty]?.label||p.difficulty} · {p.status}</small><Link href={`/fun-zone/picture-puzzles/${p.id}`}>Preview puzzle →</Link></div>
    <form action={setPicturePuzzleStatus}><input type="hidden" name="id" value={p.id}/><input type="hidden" name="status" value={p.status==="published"?"draft":"published"}/><button type="submit">{p.status==="published"?"Unpublish":"Publish"}</button></form>
   </article>)}{puzzles?.length===0?<p>No puzzles yet. Your first upload will appear here.</p>:null}</div>
  </section>
 </div></main>;
}
