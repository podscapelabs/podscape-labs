"use client";
import {useCallback,useRef,useState} from "react";
import {announceAchievement,type AchievementNotice} from "./AchievementToast";

export type PuzzleSaveState="idle"|"saving"|"saved"|"unavailable";
export function usePuzzleCompletion(gameKey:string,puzzleId:string){
 const completedRef=useRef(false);
 const [saved,setSaved]=useState<PuzzleSaveState>("idle");
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
   if(!response.ok){setSaved("unavailable");return;}
   const result=await response.json() as {unlocked?:AchievementNotice[]};
   (result.unlocked||[]).forEach(announceAchievement);
   setSaved("saved");
  }catch{setSaved("unavailable");}
 },[gameKey,puzzleId]);
 return {saved,record};
}
export function PuzzleSaveStatus({status}:{status:PuzzleSaveState}){
 return <p role="status" aria-live="polite" style={{minHeight:"1.5em",fontSize:12,lineHeight:1.5,color:"var(--text-secondary)"}}>
 {status==="saving"?"Saving puzzle completion…":status==="saved"?"Completion recorded. Achievement EXP is awarded once per milestone.":status==="unavailable"?"Puzzle finished, but the result could not be saved. No EXP was awarded.":""}
 </p>;
}
