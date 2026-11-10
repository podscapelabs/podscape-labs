import Link from "next/link";
import {redirect} from "next/navigation";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {getAllUpdates,updateCategories,validDestination,type UpdateRecord} from "@/lib/podscape-updates";
import {savePlatformUpdate,changePlatformUpdateStatus} from "./actions";
import styles from "./updates.module.css";

export const dynamic="force-dynamic";
export const metadata={title:"Updates Desk | PodScape Owner Studio",robots:{index:false,follow:false}};

function UpdateForm({entry}:{entry?:UpdateRecord}){
 return <form action={savePlatformUpdate} className={styles.form}>
  {entry?<input type="hidden" name="id" value={entry.id}/>:null}
  <div className={styles.fields}>
   <label>Category<select name="category" required defaultValue={entry?.category||"whats_improved"}>{updateCategories.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
   <label>Destination within PodScape<input name="href" type="text" maxLength={300} required pattern="/(?!/).*" placeholder="/keeper" defaultValue={entry?.href||"/app"}/></label>
   <label className={styles.full}>Headline<input name="title" required minLength={3} maxLength={100} placeholder="Smoother dashboard customization" defaultValue={entry?.title||""}/></label>
   <label className={styles.full}>Brief description <small>A quick preview for the Home dashboard, up to 240 characters.</small><textarea name="summary" rows={2} required minLength={5} maxLength={240} placeholder="A smoother and more polished PodScape experience." defaultValue={entry?.summary||""}/></label>
   <label className={styles.full}>Fixes and improvements <small>One improvement per line, up to 12 lines. These appear when users tap View update.</small><textarea name="details" rows={6} maxLength={3000} placeholder={"Dashboard widgets are easier to rearrange\nImproved QR care logging\nRefined mobile navigation"} defaultValue={(entry?.details||[]).join("\n")}/></label>
  </div>
  <div className={styles.actions}>
   <button name="intent" value="draft" className={styles.secondary} type="submit">Save draft</button>
   <button name="intent" value="publish" className={styles.primary} type="submit">{entry?.status==="published"?"Update published announcement":"Publish now"}</button>
  </div>
  {entry?.status==="published"?<p className={styles.hint}>Saving as a draft will unpublish this announcement. Publishing changes immediately affects the public feed.</p>:null}
 </form>;
}
export default async function UpdatesDesk({searchParams}:{searchParams:Promise<{saved?:string;error?:string}>}){
 if(!(await isAdminAuthenticated()))redirect("/admin");
 const [rows,params]=await Promise.all([getAllUpdates(),searchParams]);
 const drafts=(rows||[]).filter(x=>x.status==="draft");
 const published=(rows||[]).filter(x=>x.status==="published");
 return <main className={styles.page}><div className={styles.wrap}>
  <Link href="/account/owner-tools" className={styles.back}>← Owner Studio</Link>
  <header className={styles.hero}><p>OWNER STUDIO · COMMUNICATIONS</p><h1>Updates Desk</h1><span>Make meaningful progress visible. Draft first, then announce improvements after they are live.</span></header>
  {params.saved?<p role="status" className={styles.success}>Update saved successfully.</p>:null}
  {params.error?<p role="alert" className={styles.error}>Could not save the update. Check your title, destination and database connection, then retry.</p>:null}
  {rows===null?<p role="alert" className={styles.error}>Updates storage is unavailable. Check the updates database migration.</p>:null}
  <div className={styles.stats}><span><strong>{drafts.length}</strong> drafts</span><span><strong>{published.length}</strong> published</span><span><strong>{updateCategories.length}</strong> categories</span></div>
  <section className={styles.panel}><div className={styles.sectionHead}><h2>Compose an announcement</h2><span>New announcements start as drafts</span></div>
   <UpdateForm/>
  </section>
  <section className={styles.panel}><div className={styles.sectionHead}><h2>Manage announcements</h2><span>Most recently edited first</span></div>
   {!rows?.length?<p className={styles.empty}>No announcements yet. Create your first draft above.</p>:null}
   <div className={styles.list}>{(rows||[]).map(entry=><details key={entry.id} className={styles.entry}>
    <summary><span><small>{updateCategories.find(c=>c.id===entry.category)?.label||entry.category} · {entry.status==="published"?"Published":"Draft"}</small><strong>{entry.title}</strong></span><span aria-hidden="true">Edit +</span></summary>
    <p>{entry.summary}</p>
    <p className={styles.hint}>Destination: {validDestination(entry.href)?<Link href={entry.href}>{entry.href}</Link>:entry.href}{entry.published_at?" · Published "+new Date(entry.published_at).toLocaleDateString("en-CA"):null}</p>
    <UpdateForm entry={entry}/>
    {entry.status==="published"?<form action={changePlatformUpdateStatus} className={styles.statusForm}>
      <input type="hidden" name="id" value={entry.id}/><input type="hidden" name="status" value="draft"/>
      <button type="submit">Unpublish announcement</button>
     </form>:<form action={changePlatformUpdateStatus} className={styles.statusForm}>
      <input type="hidden" name="id" value={entry.id}/><input type="hidden" name="status" value="published"/>
      <button type="submit">Publish existing draft</button>
     </form>}
   </details>)}</div>
  </section>
  <p className={styles.hint}>Editorial guideline: What&apos;s Improved is for meaningful user-facing refinements; New Features is for entirely new capabilities. Internal fixes and unreleased changes should remain drafts or stay out of the feed.</p>
 </div></main>;
}
