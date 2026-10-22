"use client";
import { announceAchievement } from "@/components/AchievementToast";
export function TestAchievementButton() {
 return <button type="button" onClick={() => announceAchievement({id:"field-observer-test-"+Date.now(),title:"Field Observer",description:"You've discovered 5 unique species!",exp:50,coins:25})} style={{padding:"11px 16px",borderRadius:12,border:"1px solid #849a7c",background:"#e3ecdc",color:"#25452d",fontWeight:700,cursor:"pointer"}}>✦ Test achievement notification</button>;
}
