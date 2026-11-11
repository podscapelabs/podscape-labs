import Link from "next/link";
import {redirect} from "next/navigation";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {getSupabaseAdmin} from "@/lib/supabase-admin";
import {auditStoredExchangeWallet} from "@/lib/exchange-ranking-audit";
import {reviewMarketInvestor} from "./actions";
import styles from "./market-reviews.module.css";
export const dynamic="force-dynamic";
export const metadata={title:"Market Investor Reviews | Owner Studio",robots:{index:false,follow:false}};
export default async function MarketInvestorReviews(){
 if(!(await isAdminAuthenticated()))redirect("/admin");
 const db=getSupabaseAdmin();
 const {data:requests,error}=db?await db.from("member_exchange_ranking_reviews")
  .select("user_id,status,requested_at,reviewer_note").order("requested_at",{ascending:false}).limit(100):
  {data:null,error:null};
 const ids=(requests||[]).map(r=>r.user_id);
 const names=ids.length&&db?await db.from("customer_profiles").select("id,display_name").in("id",ids):{data:[],error:null};
 const directory=new Map((names.data||[]).map(p=>[p.id,p.display_name]));
 const reviews=await Promise.all((requests||[]).map(async req=>({
  ...req,audit:req.status==="pending"?await auditStoredExchangeWallet(req.user_id):null
 })));
 return <main className={styles.page}><div className={styles.wrap}>
  <Link className={styles.back} href="/account/owner-tools">← Owner Studio</Link>
  <header className={styles.hero}><small>OWNER STUDIO / MARKET</small><h1>Investor Reviews</h1>
   <p>Verify imported beta portfolios without resetting Duck Bucks or shares. Approval is never automatic.</p></header>
  <div className={styles.summary}>
   <div><strong>{reviews.filter(x=>x.status==="pending").length}</strong><small>Awaiting review</small></div>
   <div><strong>{reviews.filter(x=>x.status==="approved").length}</strong><small>Approved</small></div>
   <div><strong>{reviews.filter(x=>x.status==="declined").length}</strong><small>Declined</small></div>
  </div>
  {!db||error?<div className={styles.warning}>Market rankings migration has not been applied or records are unavailable.</div>:null}
  <div className={styles.cards}>
   {!reviews.length?<div className={styles.empty}>No market verification requests yet.</div>:null}
   {reviews.map(row=><article className={styles.card} key={row.user_id}>
    <div className={styles.top}><div><small>INVESTOR REQUEST</small><h2>{directory.get(row.user_id)||"PodScape Investor"}</h2>
     <p>Requested {new Date(row.requested_at).toLocaleDateString("en-CA")} · {row.user_id.slice(0,8)}</p></div>
     <span className={styles.status}>{row.status}</span>
    </div>
    {row.audit?<div className={styles.audit}>
     <strong>{row.audit.ok?"✓ Ledger reconciles":"✕ Ledger needs attention"}</strong>
     <p>{row.audit.reason}</p>
     <span>Saved cash: {row.audit.cash.toLocaleString("en-CA")} Duck Bucks · {row.audit.orders} recorded trades</span>
    </div>:null}
    {row.status==="pending"?<form className={styles.form} action={reviewMarketInvestor}>
     <input type="hidden" name="userId" value={row.user_id}/>
     <label>Review notes (optional)<input type="text" name="note" maxLength={500} placeholder="Owner review notes"/></label>
     <div className={styles.actions}>
      <button type="submit" name="decision" value="approve" disabled={!row.audit?.ok}>Approve verified wallet</button>
      <button type="submit" name="decision" value="decline">Decline request</button>
     </div>
    </form>:row.reviewer_note?<p className={styles.note}>{row.reviewer_note}</p>:null}
   </article>)}
  </div>
  <p className={styles.finePrint}>Approvals require a replayable order history, original 10,000 Duck Buck capital, valid historical quotes and matching saved balances. An audit is re-run when approving. Imported histories without sufficient evidence remain unranked. No wallet values are modified by this desk.</p>
  <Link className={styles.back} href="/fun-zone/pod-exchange/rankings">View public Market Rankings →</Link>
 </div></main>;
}
