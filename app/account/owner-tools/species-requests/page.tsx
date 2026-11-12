import Link from "next/link";
import {redirect} from "next/navigation";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {getSupabaseAdmin} from "@/lib/supabase-admin";
import {markSpeciesRequestHandled} from "@/app/ledger/requests/actions";
import styles from "@/app/ledger/requests/requests.module.css";
export const dynamic="force-dynamic";
export const metadata={title:"Species Requests | PodScape Owner",robots:{index:false,follow:false}};
export default async function SpeciesRequests({searchParams}:{searchParams:Promise<{view?:string}>}){
 if(!(await isAdminAuthenticated()))redirect("/admin");
 const handled=(await searchParams).view==="handled";
 const admin=getSupabaseAdmin();
 const result=admin?await admin.from("species_requests").select("id,name,created_at").eq("handled",handled).order("created_at",{ascending:false}).limit(200):null;
 return <main className={styles.page}><Link href="/account/owner-tools">← Owner Tools</Link>
  <h1>Species requests</h1><p>Species your members would like added to Leaf Ledger.</p>
  <nav aria-label="Request status"><Link href="/account/owner-tools/species-requests">New requests</Link>{" · "}<Link href="?view=handled">Handled</Link></nav>
  {!result||result.error?<p role="alert">Requests are temporarily unavailable. Please try again.</p>:result.data.length?<>
   <p>Showing {result.data.length}{result.data.length===200?" most recent":""} {handled?"handled":"new"} requests.</p>
   {result.data.map(request=><article key={request.id} className={styles.card}><h2>{request.name}</h2><small>{new Date(request.created_at).toLocaleDateString("en-CA",{year:"numeric",month:"short",day:"numeric"})}</small>
    <form action={markSpeciesRequestHandled}><input type="hidden" name="id" value={request.id}/><input type="hidden" name="handled" value={String(!handled)}/><button>{handled?"Move back to new":"Mark handled"}</button></form>
   </article>)}
  </>:<p>No {handled?"handled":"new"} requests yet.</p>}
 </main>;
}
