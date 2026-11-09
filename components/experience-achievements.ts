"use client";
import {announceAchievement,type AchievementNotice} from "./AchievementToast";

export type ExperienceAction="onboarding_complete"|"home_personalized"|"nav_personalized"|"species_personalized"|"manager_personalized";
const pending=new Set<ExperienceAction>();
const finished=new Set<ExperienceAction>();
/** Called from a genuine user edit or completed tutorial; no optimistic reward claims. */
export async function recordExperienceAction(action:ExperienceAction,proof:Record<string,unknown>):Promise<boolean>{
 if(pending.has(action)||finished.has(action))return false;
 pending.add(action);
 try{
  const result=await fetch("/api/progress/experience-action",{
   method:"POST",headers:{"Content-Type":"application/json"},
   body:JSON.stringify({action,proof})
  });
  if(!result.ok)return false;
  const json=await result.json() as {saved:boolean;unlocked?:AchievementNotice[]};
  if(!json.saved)return false;
  finished.add(action);
  for(const notice of json.unlocked||[])announceAchievement(notice);
  return true;
 }catch{return false}
 finally{pending.delete(action)}
}
