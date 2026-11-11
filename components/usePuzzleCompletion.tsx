"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {announceAchievement,type AchievementNotice} from "./AchievementToast";

export type PuzzleSaveState="idle"|"saving"|"saved"|"unavailable";
export function usePuzzleCompletion(gameKey:string,puzzleId:string){
 const completedRef=useRef(false);
 const [saved,setSaved]=useState<PuzzleSaveState>("idle");
 const [failedProof,setFailedProof]=useState<unknown>(null);
 const router=useRouter();
 useEffect(()=>{completedRef.current=false;setSaved("idle");setFailedProof(null)},[gameKey,puzzleId]);
 const record=useCallback(async(proof:unknown)=>{
  if(completedRef.current)return;
  completedRef.current=true;
  setSaved("saving");
  try{
   const response=await fetch("/api/progress/puzzle-complete",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({gameKey,puzzleId,proof})
   });
   if(!response.ok){completedRef.current=false;setFailedProof(proof);setSaved("unavailable");return;}
   const result=await response.json() as {unlocked?:AchievementNotice[]};
   (result.unlocked||[]).forEach(announceAchievement);
   setFailedProof(null);setSaved("saved");router.refresh();
  }catch{completedRef.current=false;setFailedProof(proof);setSaved("unavailable");}
 },[gameKey,puzzleId,router]);
 return {saved,record,retry:failedProof===null?null:()=>record(failedProof)};
}
export function PuzzleSaveStatus({status,retry}:{status:PuzzleSaveState;retry?:null|(()=>void)}){
 return <p role="status" aria-live="polite" style={{minHeight:"1.5em",fontSize:12,lineHeight:1.5,color:"var(--text-secondary)"}}>
 {status==="saving"?"Saving puzzle completion…":status==="saved"?"Progress saved.":status==="unavailable"?<>Puzzle finished, but your result could not be saved. No EXP was awarded. {retry?<button type="button" onClick={retry} style={{marginLeft:9,padding:"6px 10px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface)"}}>Retry saving</button>:null}</>:""}
 </p>;
}
