"use client";
import {announceAchievement} from "@/components/AchievementToast";

/** Owner-only visual QA; does not write completion records or reward EXP. */
export function TestAchievementButton(){
 const style={padding:"11px 14px",minHeight:44,borderRadius:12,border:"1px solid var(--border)",background:"var(--surface-secondary)",color:"var(--text-primary)",fontWeight:700,cursor:"pointer"} as const;
 return <div style={{display:"flex",flexWrap:"wrap",gap:9}}>
  <button type="button" style={style} onClick={()=>announceAchievement({
   id:"standard-visual-test-"+Date.now(),title:"Sample Achievement",
   description:"A preview of the standard PodScape achievement banner.",exp:10
  })}>Preview achievement</button>
  <button type="button" style={style} onClick={()=>announceAchievement({
   id:"hidden-visual-test-"+Date.now(),title:"Secret Unlocked",
   description:"A preview of how a hidden discovery is revealed.",exp:20,hidden:true
  })}>Preview hidden reveal</button>
 </div>;
}
