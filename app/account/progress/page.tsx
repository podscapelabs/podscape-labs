import { redirect } from "next/navigation";
import { achievementCatalog } from "@/data/achievement-catalog";
import { customerSupabase } from "@/lib/customer-auth/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import ProgressDashboard from "./ProgressDashboard";

export const dynamic = "force-dynamic";
export default async function ProgressPage() {
  const db = await customerSupabase();
  if (!db) redirect("/account/login");
  const {data:{user}} = await db.auth.getUser();
  if (!user) redirect("/account/login");

  // Reconcile tracked actions into permanent, one-time achievement unlocks.
  // This privileged operation can only be invoked server-side for the signed-in user.
  const admin = getSupabaseAdmin();
  let syncError = false;
  if (admin) {
    const [{error:legacyError},{error:extendedError},{error:collectionError}] = await Promise.all([
      admin.rpc("sync_member_achievements",{p_user_id:user.id}),
      admin.rpc("reconcile_member_extended_achievements",{p_user_id:user.id}),
      admin.rpc("reconcile_member_collection_specialists",{p_user_id:user.id})
    ]);
    if (legacyError||extendedError||collectionError) {
      syncError = true;
      console.error("Achievement reconciliation failed",legacyError?.code||extendedError?.code);
    }
  } else {
    syncError = true;
  }

  const [{data:progress},{data:achievements,error:achievementsError},{count:speciesViews},{count:collectionSpecies},{count:puzzleCount,error:puzzleCountError}] = await Promise.all([
    db.from("member_progress").select("total_exp").eq("user_id",user.id).maybeSingle(),
    db.from("member_achievements").select("achievement_key,unlocked_at").eq("user_id",user.id),
    db.from("member_species_views").select("species_id", {count:"exact",head:true}).eq("user_id",user.id),
    db.from("member_species_collection").select("species_id", {count:"exact",head:true}).eq("user_id",user.id),
    db.from("member_puzzle_completions").select("puzzle_id", {count:"exact",head:true}).eq("user_id",user.id),
  ]);
  const exp = Math.max(0,Number(progress?.total_exp||0));
  const level = Math.floor(Math.sqrt(exp/100))+1;
  const earned = new Map((achievements||[]).map(item=>[item.achievement_key,item.unlocked_at]));
  const legacyObserver = earned.get("field_observer");
  if (legacyObserver && !earned.has("ledger_five_species")) earned.set("ledger_five_species",legacyObserver);

  return <ProgressDashboard exp={exp} level={level}
    levelStart={100*(level-1)**2} levelEnd={100*level**2}
    error={Boolean(achievementsError)||syncError}
    discoveries={speciesViews??0} collectionSpecies={collectionSpecies??0} puzzleCompletions={puzzleCountError?null:puzzleCount??0}
    achievements={achievementCatalog.map(entry=>({
      ...entry, unlockedAt:earned.get(entry.key)||null,
    }))}/>;
}
