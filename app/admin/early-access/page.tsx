import {redirect} from "next/navigation";
import {OwnerDeskHeader,OwnerDeskSection,OwnerDeskNotice} from "@/components/OwnerDeskFoundation";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {getSupabaseAdmin} from "@/lib/supabase-admin";
import {addEarlyAccessTester,revokeEarlyAccessTester} from "./actions";
import styles from "./early-access.module.css";

export const dynamic="force-dynamic";

export default async function EarlyAccessManager({searchParams}:{searchParams:Promise<{added?:string;revoked?:string;error?:string}>}){
 if(!(await isAdminAuthenticated()))redirect("/admin");
 const db=getSupabaseAdmin();
 const {data,error}=db?await db.from("early_access_testers").select("email,active,created_at").order("created_at",{ascending:false}):{data:null,error:new Error("Not configured")};
 const testers=data||[],params=await searchParams;
 const activeCount=testers.filter(t=>t.active).length;
 return <main className={styles.page}>
  <OwnerDeskHeader area="Access" title="Early Access" description="Approve a tester’s email before registration. Every editing desk remains owner-only." icon="community"/>
  {params.added?<OwnerDeskNotice kind="success">Tester approved. You can share the Early Access link.</OwnerDeskNotice>:null}
  {params.revoked?<OwnerDeskNotice kind="success">Tester access revoked.</OwnerDeskNotice>:null}
  {params.error?<OwnerDeskNotice kind="error">Unable to update tester access. Check the email and try again.</OwnerDeskNotice>:null}
  {error?<OwnerDeskNotice kind="error">The tester database is unavailable. Check the early-access migration.</OwnerDeskNotice>:null}
  <div className={styles.sections}>
   <OwnerDeskSection title="Approve a tester" description="Add their registration email; approval does not send an automatic invitation.">
    <form action={addEarlyAccessTester} className={styles.form}>
     <label>Email address<input name="email" type="email" required maxLength={254} placeholder="friend@example.com" autoComplete="off"/></label>
     <button type="submit" disabled={Boolean(error)}>Approve email</button>
    </form>
    <p className={styles.help}>After approval, share <a href="https://www.podscapelabs.com/early-access">podscapelabs.com/early-access</a>. Testers register with the email you approved.</p>
   </OwnerDeskSection>
   <OwnerDeskSection title="Approved testers" description={activeCount+" active · "+testers.length+" total"}>
    {!testers.length?<p className={styles.help}>No testers yet. Add the first email above.</p>:null}
    <div className={styles.list}>
     {testers.map(t=><div className={styles.row} key={t.email}>
      <div className={styles.identity}><strong>{t.email}</strong><span>{t.active?"Active tester":"Access revoked"}</span></div>
      {t.active?<form action={revokeEarlyAccessTester}><input type="hidden" name="email" value={t.email}/><button type="submit" className={styles.secondary} disabled={Boolean(error)}>Revoke access</button></form>:<form action={addEarlyAccessTester}><input type="hidden" name="email" value={t.email}/><button type="submit" className={styles.secondary} disabled={Boolean(error)}>Re-approve</button></form>}
     </div>)}
    </div>
   </OwnerDeskSection>
  </div>
 </main>;
}
