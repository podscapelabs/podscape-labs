import { redirect } from "next/navigation";
import { customerSupabase } from "@/lib/customer-auth/server";
import ProgressDashboard from "./ProgressDashboard";

export const dynamic = "force-dynamic";
export default async function ProgressPage() {
 const db = await customerSupabase();
 if (!db) redirect("/account/login");
 const {data:{user}} = await db.auth.getUser();
 if (!user) redirect("/account/login");
 const [{data:progress},{data:achievements,error:achievementsError}] = await Promise.all([
  db.from("member_progress").select("total_exp,pod_coins").eq("user_id",user.id).maybeSingle(),
  db.from("member_achievements").select("achievement_key,unlocked_at").eq("user_id",user.id)
 ]);
 const exp = Math.max(0,Number(progress?.total_exp||0));
 const coins = Math.max(0,Number(progress?.pod_coins||0));
 const level = Math.floor(Math.sqrt(exp/100))+1;
 const fieldObserver = achievements?.find(item => item.achievement_key === "field_observer" || item.achievement_key === "ledger_five_species");
 return <ProgressDashboard exp={exp} coins={coins} level={level} levelStart={100*(level-1)**2} levelEnd={100*level**2} error={Boolean(achievementsError)} achievements={[
  {key:"field_observer",title:"Field Observer",description:"Discover 5 unique species profiles in the Leaf Ledger while signed in.",exp:50,coins:25,unlockedAt:fieldObserver?.unlocked_at,status:"available"},
  {key:"care_journal",title:"Care Journal",description:"Future recognition for thoughtful colony care and consistent record keeping.",exp:0,coins:0,status:"planned"},
  {key:"curious_keeper",title:"Curious Keeper",description:"Future learning milestones through guides and exploration.",exp:0,coins:0,status:"planned"}
 ]}/>;
}
