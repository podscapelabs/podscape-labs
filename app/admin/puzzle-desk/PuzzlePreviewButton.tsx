"use client";
import {useEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";
import {PicturePuzzleBoard} from "@/app/fun-zone/picture-puzzles/PicturePuzzleBoard";
import {DIFFICULTIES,PUZZLE_TYPES,type Difficulty,type PuzzleType} from "@/lib/picture-puzzles-client";
import styles from "./puzzle-preview.module.css";

type Preview={id:string;imageUrl:string;blob:boolean;title:string;description:string;imageAlt:string;learningNote:string;artistCredit:string;difficulty:Difficulty;puzzleType:PuzzleType;level:number};
export function PuzzlePreviewButton({imageUrl}:{imageUrl?:string}){
 const [preview,setPreview]=useState<Preview|null>(null);
 const [error,setError]=useState("");
 const [mounted,setMounted]=useState(false);
 const dialog=useRef<HTMLElement>(null);
 const trigger=useRef<HTMLButtonElement>(null);
 useEffect(()=>setMounted(true),[]);
 useEffect(()=>{
  if(!preview)return;
  const focus=document.activeElement as HTMLElement|null;
  const oldOverflow=document.body.style.overflow;
  document.body.style.overflow="hidden";
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==="Escape"){event.preventDefault();setPreview(null);return;}
   if(event.key!=="Tab"||!dialog.current)return;
   const controls=Array.from(dialog.current.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]'));
   if(!controls.length)return;
   const first=controls[0],last=controls[controls.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  };
  requestAnimationFrame(()=>dialog.current?.querySelector<HTMLElement>('button[aria-label="Close puzzle preview"]')?.focus({preventScroll:true}));
  document.addEventListener("keydown",onKey);
  return ()=>{document.body.style.overflow=oldOverflow;document.removeEventListener("keydown",onKey);if(preview.blob)URL.revokeObjectURL(preview.imageUrl);(trigger.current||focus)?.focus?.()};
 },[preview]);
 const open=(event:React.MouseEvent<HTMLButtonElement>)=>{
  const form=event.currentTarget.closest("form");
  if(!form)return;
  setError("");
  const data=new FormData(form);
  const image=data.get("image");
  const upload=image instanceof File&&image.size>0?image:null;
  if(upload&&(upload.size>8*1024*1024||!["image/jpeg","image/png","image/webp"].includes(upload.type))){setError("Choose a JPEG, PNG or WebP image under 8 MB.");return;}
  if(!upload&&!imageUrl){setError("Choose an image before previewing your puzzle.");return;}
  const type=String(data.get("puzzle_type")||"jigsaw");
  const difficulty=String(data.get("difficulty")||"easy");
  const level=Number(data.get("level")||1);
  if(!(type in PUZZLE_TYPES)||!(difficulty in DIFFICULTIES)||!Number.isInteger(level)||level<1||level>6){setError("Choose valid puzzle settings first.");return;}
  const url=upload?URL.createObjectURL(upload):imageUrl!;
  setPreview({
   id:"owner-draft-preview-"+Date.now(),imageUrl:url,blob:Boolean(upload),
   title:String(data.get("title")||"Untitled puzzle").trim()||"Untitled puzzle",
   description:String(data.get("description")||""),imageAlt:String(data.get("image_alt")||"Puzzle artwork"),
   learningNote:String(data.get("learning_note")||""),artistCredit:String(data.get("artist_credit")||"").trim(),
   difficulty:difficulty as Difficulty,puzzleType:type as PuzzleType,level,
  });
 };
 return <>
  <div className={styles.actions}><button ref={trigger} type="button" className={styles.previewButton} onClick={open}>Preview &amp; play puzzle</button><span>Try the selected puzzle before saving. No progress or rewards are recorded.</span></div>
  {error?<p className={styles.error} role="alert">{error}</p>:null}
  {mounted&&preview?createPortal(
   <div className={styles.backdrop} onPointerDown={event=>{if(event.target===event.currentTarget)setPreview(null)}}>
    <section ref={dialog} className={styles.modal+" v2-site"} role="dialog" aria-modal="true" aria-label="Puzzle test preview">
     <header className={styles.header}><div><small>OWNER STUDIO · UNSAVED PREVIEW</small><strong>Test your puzzle</strong><p>Play exactly as a member would. This preview never publishes or awards EXP.</p></div><button type="button" onClick={()=>setPreview(null)} aria-label="Close puzzle preview">×</button></header>
     <div className={styles.game}><PicturePuzzleBoard key={preview.id} id={preview.id} userId="owner-preview" title={preview.title} description={preview.description} imageAlt={preview.imageAlt} learningNote={preview.learningNote} artistCredit={preview.artistCredit} imageUrl={preview.imageUrl} difficulty={preview.difficulty} puzzleType={preview.puzzleType} level={preview.level} rewardsEnabled={false} previewMode/></div>
     <footer className={styles.footer}><button type="button" onClick={()=>setPreview(null)}>Back to editing</button><span>Changes aren&apos;t saved until you submit the form.</span></footer>
    </section>
   </div>,document.body):null}
 </>;
}
