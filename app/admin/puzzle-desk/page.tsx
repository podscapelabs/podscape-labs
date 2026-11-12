import Link from "next/link";
import {redirect} from "next/navigation";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {DIFFICULTIES,PUZZLE_TYPES,LEVEL_NAMES,levelLabel,gridDescription,listPicturePuzzles,picturePuzzleImage,type PicturePuzzle} from "@/lib/picture-puzzles";
import {createPicturePuzzle,updatePicturePuzzle,setPicturePuzzleStatus} from "./actions";
import styles from "./puzzle-desk.module.css";
export const dynamic="force-dynamic";
export const metadata={title:"Puzzle Desk | PodScape Owner Studio",robots:{index:false,follow:false}};
function Fields({entry}:{entry?:PicturePuzzle}){
 return <div className={styles.formFields}>
  <label>Puzzle title<input name="title" required minLength={3} maxLength={90} defaultValue={entry?.title||""} placeholder="Rubber Ducky — PodBound artwork"/></label>
  <label>Game format<select name="puzzle_type" defaultValue={entry?.puzzle_type||"jigsaw"}>{Object.entries(PUZZLE_TYPES).map(([key,value])=><option key={key} value={key}>{value}</option>)}</select><small>Jigsaw: piece assembly · Sliding: move tiles into the empty space.</small></label>
  <label>Fun Zone level<select name="level" defaultValue={entry?.level||1}>{Array.from({length:LEVEL_NAMES.length},(_,i)=>i+1).map(n=><option key={n} value={n}>{levelLabel(n)}</option>)}</select><small>Uses the same progression labels as other Fun Zone challenges.</small></label>
  <label>Board complexity<select name="difficulty" defaultValue={entry?.difficulty||"easy"}>{Object.entries(DIFFICULTIES).map(([key,value])=><option key={key} value={key}>{value.label} · {value.columns} × {value.rows} grid</option>)}</select><small>Separate from the level. Set how many pieces players work with.</small></label>
  <label className={styles.full}>Description<textarea name="description" maxLength={240} rows={2} defaultValue={entry?.description||""} placeholder="Rebuild a favourite scene from PodBound."/></label>
  <label className={styles.full}>Learning cue <small>Optional educational note, consistent with the Fun Zone learning path.</small><textarea name="learning_note" maxLength={300} rows={2} defaultValue={entry?.learning_note||""} placeholder="Look for the distinctive patterns on this isopod's body."/></label>
  <label className={styles.full}>Artwork description (accessibility)<input name="image_alt" minLength={3} maxLength={180} required defaultValue={entry?.image_alt||""} placeholder="Illustration of a Rubber Ducky isopod on moss."/></label>
 </div>;
}
export default async function PuzzleDesk({searchParams}:{searchParams:Promise<{saved?:string;error?:string}>}){
 if(!await isAdminAuthenticated())redirect("/admin");
 const [puzzles,params]=await Promise.all([listPicturePuzzles(true),searchParams]);
 return <main className={styles.page}><div className={styles.wrap}>
  <Link href="/account/owner-tools" className={styles.back}>← Owner Studio</Link>
  <header className={styles.hero}><span>OWNER STUDIO / FUN ZONE</span><h1>Puzzle Desk</h1><p>One artwork library for two kinds of mobile puzzles. Set the Fun Zone level, game format and challenge complexity before publishing.</p></header>
  {params.saved?<p role="status" className={styles.notice}>Puzzle {params.saved==="updated"?"updated":params.saved==="draft"?"saved as draft":params.saved+" successfully"}.</p>:null}
  {params.error?<p role="alert" className={styles.alert}>{params.error==="completed-immutable"?"This puzzle has saved completions. Its game format and difficulty are now locked to preserve player progress.": "Could not save. Check required fields, image format, storage bucket, and database migrations."}</p>:null}
  {puzzles===null?<p role="alert" className={styles.alert}>Puzzle storage is not ready. Apply the picture-puzzles migrations first.</p>:null}
  <section className={styles.card}><div className={styles.heading}><span>CREATE</span><h2>New picture puzzle</h2><p>Create a draft first. Jigsaw and Sliding Puzzle share PodScape&apos;s existing level progression.</p></div>
   <form action={createPicturePuzzle} className={styles.form}><Fields/>
    <label className={styles.full}>Puzzle artwork <small>JPEG, PNG or WebP · Max 8 MB · Use artwork you own or can publish</small><input name="image" type="file" accept="image/png,image/jpeg,image/webp" required/></label>
    <button type="submit">Save draft puzzle →</button>
   </form>
  </section>
  <section className={styles.card}><div className={styles.heading}><span>LIBRARY</span><h2>Manage puzzles</h2><p>{puzzles?.length||0} puzzles · {puzzles?.filter(p=>p.status==="published").length||0} published · {LEVEL_NAMES.length} named Fun Zone progression levels</p></div>
   <div className={styles.list}>{(puzzles||[]).map(p=><article key={p.id} className={styles.item}>
    <div className={styles.art} style={{backgroundImage:`url("${picturePuzzleImage(p.image_path)}")`}} role="img" aria-label={p.image_alt||p.title}/>
    <div className={styles.itemInfo}><strong>{p.title}</strong><small>{PUZZLE_TYPES[p.puzzle_type]||"Jigsaw"} · {levelLabel(p.level)} · {DIFFICULTIES[p.difficulty].label} · {gridDescription(p.puzzle_type,p.difficulty)} · {p.status}</small><Link href={`/fun-zone/picture-puzzles/${p.id}`}>Preview →</Link></div>
    <form action={setPicturePuzzleStatus}><input type="hidden" name="id" value={p.id}/><input type="hidden" name="status" value={p.status==="published"?"draft":"published"}/><button type="submit">{p.status==="published"?"Unpublish":"Publish"}</button></form>
    <details className={styles.editor}><summary>Edit puzzle settings</summary><form action={updatePicturePuzzle} className={styles.form}><input type="hidden" name="id" value={p.id}/><Fields entry={p}/><button type="submit">Save changes</button></form></details>
   </article>)}{puzzles?.length===0?<p>No puzzles yet. Your first upload will appear here.</p>:null}</div>
  </section>
 </div></main>;
}
