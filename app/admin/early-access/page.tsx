import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { addEarlyAccessTester, revokeEarlyAccessTester } from "./actions";

export const dynamic = "force-dynamic";

export default async function EarlyAccessManager({ searchParams }: { searchParams: Promise<{ added?: string; revoked?: string; error?: string }> }) {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const db = getSupabaseAdmin();
  const { data, error } = db ? await db.from("early_access_testers").select("email,active,created_at").order("created_at", { ascending: false }) : { data: null, error: new Error("Not configured") };
  const testers = data || [];
  const params = await searchParams;
  return <main className="admin-shell" style={{maxWidth:900,margin:"0 auto"}}>
    <header style={{marginBottom:24}}>
      <Link href="/admin" className="admin-back-link">← Owner Studio</Link>
      <p className="eyebrow" style={{marginTop:24}}>Owner Studio · Private testing</p>
      <h1 style={{fontFamily:"var(--serif)",fontSize:"clamp(2.2rem,6vw,3.7rem)",fontWeight:400}}>Early Access</h1>
      <p style={{color:"var(--muted)",lineHeight:1.6}}>Approve a friend&apos;s email before they register. They can explore the platform with their own account; all editing tools remain owner-only.</p>
    </header>
    {params.added ? <p className="admin-save-message is-success">Tester approved. You can share the Early Access link.</p> : null}
    {params.revoked ? <p className="admin-save-message is-success">Tester access revoked.</p> : null}
    {params.error ? <p className="admin-save-message is-error">Unable to update tester access. Check the email and try again.</p> : null}
    {error ? <p className="admin-save-message is-error">The tester database is unavailable. Check the early-access migration.</p> : null}
    <section style={{background:"var(--paper)",border:"1px solid var(--line)",borderRadius:16,padding:"clamp(18px,4vw,28px)",marginBottom:16}}>
      <h2 style={{fontFamily:"var(--serif)",fontWeight:400,margin:"0 0 12px"}}>Approve a tester</h2>
      <form action={addEarlyAccessTester} style={{display:"flex",flexWrap:"wrap",gap:10}}>
        <label style={{flex:"1 1 230px",display:"grid",gap:7,fontSize:".75rem"}}>Email address
          <input name="email" type="email" required maxLength={254} placeholder="friend@example.com" autoComplete="off" style={{minHeight:46,padding:"10px 12px",border:"1px solid var(--line)",borderRadius:9,background:"var(--paper-strong)",color:"var(--ink)",font:"inherit"}}/>
        </label>
        <button type="submit" className="button button-primary" style={{alignSelf:"end",minHeight:46}}>Approve email</button>
      </form>
      <p style={{fontSize:".72rem",color:"var(--muted)",marginTop:16}}>Share this link after approval: <a href="https://www.podscapelabs.com/early-access">podscapelabs.com/early-access</a>. No email is sent automatically.</p>
    </section>
    <section style={{background:"var(--paper)",border:"1px solid var(--line)",borderRadius:16,padding:"clamp(18px,4vw,28px)"}}>
      <h2 style={{fontFamily:"var(--serif)",fontWeight:400,margin:"0 0 12px"}}>Approved testers ({testers.filter(t=>t.active).length})</h2>
      {testers.length === 0 ? <p style={{color:"var(--muted)"}}>No testers yet. Add your first email when you&apos;re ready.</p> : null}
      <div style={{display:"grid",gap:10}}>
        {testers.map(t=><div key={t.email} style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,padding:"13px 0",borderBottom:"1px solid var(--line)"}}>
          <div><strong style={{overflowWrap:"anywhere"}}>{t.email}</strong><p style={{fontSize:".7rem",color:"var(--muted)",margin:"3px 0 0"}}>{t.active ? "Active tester" : "Access revoked"}</p></div>
          {t.active ? <form action={revokeEarlyAccessTester}><input type="hidden" name="email" value={t.email}/><button type="submit" className="button button-outline">Revoke access</button></form> : <form action={addEarlyAccessTester}><input type="hidden" name="email" value={t.email}/><button type="submit" className="button button-outline">Re-approve</button></form>}
        </div>)}
      </div>
    </section>
  </main>;
}
