"use client";
import {announceAchievement,type AchievementNotice} from "./AchievementToast";
import type {Trade} from "@/lib/pod-exchange";

const pending=new Set<string>();
const completed=new Set<string>();

/** Reward only successfully saved player trades. Network failures never claim EXP.
 * The server records each eligible trade once and handles actual EXP accounting.
 */
export async function recordExchangeTradeAchievements(trade:Trade):Promise<void>{
 if(pending.has(trade.id)||completed.has(trade.id))return;
 pending.add(trade.id);
 try{
  const response=await fetch("/api/progress/exchange-trade",{
   method:"POST",headers:{"Content-Type":"application/json"},
   body:JSON.stringify({trade})
  });
  if(!response.ok)return;
  const json=await response.json() as {saved:boolean;unlocked?:AchievementNotice[]};
  if(!json.saved)return;
  completed.add(trade.id);
  for(const notice of json.unlocked||[])announceAchievement(notice);
 }catch{/* The local game still works when the beta progress service is offline. */}
 finally{pending.delete(trade.id)}
}
