import Link from "next/link";
import {OwnerDeskHeader} from "@/components/OwnerDeskFoundation";
import {redirect} from "next/navigation";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {DIFFICULTIES,PUZZLE_TYPES,LEVEL_NAMES,levelLabel,gridDescription,listPicturePuzzles,picturePuzzleImage,type PicturePuzzle} from "@/lib/picture-puzzles";
import {PodscapeLineIcon} from "@/components/PodscapeLineIcon";
import {createPicturePuzzle,updatePicturePuzzle,setPicturePuzzleStatus} from "./actions";
import {PuzzlePreviewButton} from "./PuzzlePreviewButton";
import {PuzzleArtworkPicker} from "./PuzzleArtworkPicker";
import {PuzzlePublicationButton} from "./PuzzlePublicationButton";
import styles from "./puzzle-desk.module.css";

export const dynamic="force-dynamic";
export const metadata={title:"Puzzle Desk | PodScape Owner Studio",robots:{index:false,follow:false}};

function EditorFields({entry}:{entry?:PicturePuzzle}){
 return <div className={styles.fieldSections}>
  <section className={styles.fieldSection} aria-label="Puzzle basics">
   <div className={styles.sectionIntro}><span className={styles.step}>01</span><div><h3>The basics</h3><p>Give your puzzle a clear name for members to recognize.</p></div></div>
   <div className={styles.formFields}>
    <label className={styles.full}>Puzzle title<input name="title" required minLength={3} maxLength={90} defaultValue={entry?.title||""} placeholder="Rubber Ducky — PodBound artwork"/></label>
    <label className={styles.full}>Description <small>Optional · Displayed with your puzzle</small><textarea name="description" maxLength={240} rows={2} defaultValue={entry?.description||""} placeholder="Rebuild a favourite scene from PodBound."/></label>
   </div>
  </section>
  <section className={styles.fieldSection} aria-label="Puzzle gameplay">
   <div className={styles.sectionIntro}><span className={styles.step}>02</span><div><h3>Game setup</h3><p>Choose how members play and where it fits in the Fun Zone.</p></div></div>
   <div className={styles.formFields}>
    <label>Game format<select name="puzzle_type" defaultValue={entry?.puzzle_type||"jigsaw"}>{Object.entries(PUZZLE_TYPES).map(([key,value])=><option key={key} value={key}>{value}</option>)}</select><small>Jigsaw assembly or sliding tiles</small></label>
    <label>Board complexity<select name="difficulty" defaultValue={entry?.difficulty||"easy"}>{Object.entries(DIFFICULTIES).map(([key,value])=><option key={key} value={key}>{value.label} · {value.columns} × {value.rows}</option>)}</select><small>Controls how many pieces are used</small></label>
    <label className={styles.full}>Fun Zone level<select name="level" defaultValue={entry?.level||1}>{Array.from({length:LEVEL_NAMES.length},(_,i)=>i+1).map(n=><option key={n} value={n}>{levelLabel(n)}</option>)}</select><small>Progression level is separate from board complexity</small></label>
   </div>
  </section>
  <section className={styles.fieldSection} aria-label="Learning and accessibility">
   <div className={styles.sectionIntro}><span className={styles.step}>03</span><div><h3>Learning details</h3><p>Credit the original artist, add an educational cue, and describe the artwork for accessibility.</p></div></div>
   <div className={styles.formFields}>
    <label className={styles.full}>Learning cue <small>Optional</small><textarea name="learning_note" maxLength={300} rows={2} defaultValue={entry?.learning_note||""} placeholder="Look for distinctive patterns on this isopod's body."/></label>
    <label className={styles.full}>Original artist credit <small>Required · Publicly displayed beneath the puzzle</small><input name="artist_credit" minLength={2} maxLength={120} required defaultValue={entry?.artist_credit||""} placeholder="e.g., Ola — original PodBound artwork"/></label>
    <label className={styles.full}>Artwork description <small>Required for accessibility</small><input name="image_alt" minLength={3} maxLength={180} required defaultValue={entry?.image_alt||""} placeholder="Illustration of a Rubber Ducky isopod on moss."/></label>
   </div>
  </section>
 </div>;
}

export default async function PuzzleDesk({searchParams}:{searchParams:Promise<{saved?:string;error?:string}>}){
 if(!await isAdminAuthenticated())redirect("/admin");
 const [puzzles,params]=await Promise.all([listPicturePuzzles(true),searchParams]);
 const total=puzzles?.length||0;
 const published=puzzles?.filter(p=>p.status==="published").length||0;
 const drafts=total-published;
 return <main className={styles.page}><div className={styles.wrap}>
  <Link href="/account/owner-tools" className={styles.back}>← Owner Studio</Link>
  <OwnerDeskHeader area="Fun Zone" title="Puzzle Desk" description="Upload artwork, choose a challenge, play-test it, then publish." icon="grid" actions={[{href:"/fun-zone/picture-puzzles",label:"View puzzles",icon:"gamepad",external:true}]} aside={<div className={styles.heroStats} aria-label="Puzzle library overview"><span><strong>{total}</strong> Total</span><span><strong>{drafts}</strong> Drafts</span><span><strong>{published}</strong> Published</span></div>}/>
  {params.saved?<p role="status" className={styles.notice}>Puzzle {params.saved==="updated"?"updated":params.saved==="draft"?"saved as draft":params.saved+" successfully"}.</p>:null}
  {params.error?<p role="alert" className={styles.alert}>{params.error==="completed-immutable"?"This puzzle already has completions. Its format, difficulty and level cannot change without affecting player progress.":params.error==="artist-credit"?"Add an original artist credit before publishing this puzzle.":"Could not save. Check the required fields, artwork, storage and database."}</p>:null}
  {puzzles===null?<p role="alert" className={styles.alert}>Puzzle storage is unavailable. Check the picture puzzle database configuration.</p>:null}

  <section className={styles.card} aria-labelledby="create-puzzle-heading">
   <div className={styles.heading}><span>CREATE A CHALLENGE</span><h2 id="create-puzzle-heading">New picture puzzle</h2><p>One simple workflow. Configure it, play-test it, then save a private draft.</p></div>
   <form action={createPicturePuzzle} className={styles.form}>
    <EditorFields/>
    <section className={styles.fieldSection} aria-label="Upload puzzle artwork">
     <div className={styles.sectionIntro}><span className={styles.step}>04</span><div><h3>Artwork</h3><p>Your image becomes the actual puzzle pieces.</p></div></div>
     <PuzzleArtworkPicker/>
    </section>
    <div className={styles.publishBar}>
     <div><strong>Ready to see it in action?</strong><p>Previewing does not save, publish or award EXP.</p></div>
     <div className={styles.publishActions}><PuzzlePreviewButton/><button type="submit" className={styles.primaryButton}>Save as draft →</button></div>
    </div>
   </form>
  </section>

  <section className={styles.card} aria-labelledby="puzzle-library-heading">
   <div className={styles.heading}><span>YOUR LIBRARY</span><h2 id="puzzle-library-heading">Manage puzzles</h2><p>{total} total · {drafts} draft{drafts===1?"":"s"} · {published} published</p></div>
   <div className={styles.list}>{(puzzles||[]).map(p=><article key={p.id} className={styles.item}>
    <div className={styles.art} style={{backgroundImage:`url("${picturePuzzleImage(p.image_path)}")`}} role="img" aria-label={p.image_alt||p.title}/>
    <div className={styles.itemInfo}>
     <span className={styles.status} data-status={p.status}>{p.status==="published"?"Published":"Draft"}</span>
     <strong>{p.title}</strong>
     <small>{PUZZLE_TYPES[p.puzzle_type]||"Jigsaw"} · {levelLabel(p.level)} · {DIFFICULTIES[p.difficulty].label}</small>
     <span className={styles.gridHint}>{gridDescription(p.puzzle_type,p.difficulty)}</span>
     <span className={styles.gridHint}>Art by {p.artist_credit||"Artist credit needed"}</span>
     <Link href={`/fun-zone/picture-puzzles/${p.id}`}>Play saved puzzle →</Link>
    </div>
    <form className={styles.statusForm} action={setPicturePuzzleStatus}>
     <input type="hidden" name="id" value={p.id}/>
     <input type="hidden" name="status" value={p.status==="published"?"draft":"published"}/>
     <PuzzlePublicationButton published={p.status==="published"}/>
    </form>
    <details className={styles.editor}>
     <summary><PodscapeLineIcon name="edit"/> Edit puzzle settings</summary>
     <form action={updatePicturePuzzle} className={styles.form}>
      <input type="hidden" name="id" value={p.id}/>
      <EditorFields entry={p}/>
      <div className={styles.publishBar}>
       <div><strong>Review your changes</strong><p>Use the preview before updating this puzzle.</p></div>
       <div className={styles.publishActions}><PuzzlePreviewButton imageUrl={picturePuzzleImage(p.image_path)}/><button className={styles.primaryButton} type="submit">Save changes →</button></div>
      </div>
     </form>
    </details>
   </article>)}
   {puzzles?.length===0?<div className={styles.empty}><span className={styles.emptyIcon}><PodscapeLineIcon name="grid"/></span><h3>Your puzzle library starts here</h3><p>Upload artwork above, try the puzzle yourself, and save it as a draft. Published puzzles will appear in the Fun Zone.</p><a href="#create-puzzle-heading">Create your first puzzle ↑</a></div>:null}
   </div>
  </section>
 </div></main>;
}
