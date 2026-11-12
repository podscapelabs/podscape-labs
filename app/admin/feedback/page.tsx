import Link from "next/link";
import {redirect} from "next/navigation";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {getSupabaseAdmin} from "@/lib/supabase-admin";
import {PodscapeLineIcon} from "@/components/PodscapeLineIcon";
import {updateFeedbackStatus} from "./actions";
import styles from "./feedback-desk.module.css";

export const dynamic="force-dynamic";
export const metadata={title:"Feedback Desk | PodScape Owner Studio",robots:{index:false,follow:false}};
type Category="bug"|"idea"|"general";
type Status="new"|"reviewing"|"resolved";
type Item={id:string;user_id:string;category:Category;status:Status;message:string;page_path:string;device_info:string;owner_note:string;created_at:string;updated_at:string};
const types:Record<Category,string>={bug:"Bug report",idea:"Idea",general:"General feedback"};
const stateNames:Record<Status,string>={new:"New",reviewing:"Reviewing",resolved:"Resolved"};
const statuses=["all","new","reviewing","resolved"] as const;
const categories=["all","bug","idea","general"] as const;
function linkFor(status:string,category:string,page=1){const params=new URLSearchParams();if(status!=="all")params.set("status",status);if(category!=="all")params.set("category",category);if(page>1)params.set("page",String(page));const search=params.toString();return "/admin/feedback"+(search?"?"+search:"")}
function safePage(value:string){return value.startsWith("/")&&!value.startsWith("//")&&!value.includes("\\")?value:"/"}
function formattedDate(value:string){const date=new Date(value);return Number.isNaN(date.getTime())?value:date.toLocaleString("en-CA",{year:"numeric",month:"short",day:"numeric",hour:"numeric",minute:"2-digit",timeZone:"America/Toronto"})}
export default async function FeedbackDesk({searchParams}:{searchParams:Promise<{status?:string;category?:string;notice?:string;page?:string}>}){
 if(!await isAdminAuthenticated())redirect("/admin");
 const params=await searchParams;
 const status=statuses.find(item=>item===params.status)||"all";
 const category=categories.find(item=>item===params.category)||"all";
 const rawPage=Number(params.page||1);
 const pageNumber=Number.isSafeInteger(rawPage)&&rawPage>=1&&rawPage<=10000?rawPage:1;
 const pageSize=50;
 const db=getSupabaseAdmin();
 let items:Item[]=[];
 let total=0;
 let error="";
 const names:Record<string,string>={};
 if(!db)error="The feedback database isn't configured.";
 else{
  let query=db.from("member_feedback").select("id,user_id,category,status,message,page_path,device_info,owner_note,created_at,updated_at",{count:"exact"})
   .order("created_at",{ascending:false}).range((pageNumber-1)*pageSize,pageNumber*pageSize-1);
  if(status!=="all")query=query.eq("status",status);
  if(category!=="all")query=query.eq("category",category);
  const result=await query;
  if(result.error)error="Feedback isn't available yet. Check the member-feedback migration.";
  else{
   items=(result.data||[]) as Item[];
   total=result.count||0;
   const ids=[...new Set(items.map(item=>item.user_id))];
   if(ids.length){
    const profiles=await db.from("customer_profiles").select("id,display_name").in("id",ids);
    if(!profiles.error)for(const p of profiles.data||[])names[p.id]=p.display_name||"PodScape member";
   }
  }
 }
 return <main className={styles.page}><div className={styles.wrap}>
  <Link href="/account/owner-tools" className={styles.back}>← Owner Studio</Link>
  <header className={styles.hero}><span>OWNER STUDIO / COMMUNITY</span><h1>Feedback Desk</h1><p>Every bug, idea, and improvement request from your beta testers—organized in one place.</p></header>
  {params.notice==="updated"?<p className={styles.notice} role="status">Feedback status updated.</p>:null}
  {params.notice==="invalid"||params.notice==="unavailable"?<p className={styles.error} role="alert">That update could not be saved. Please try again.</p>:null}
  {error?<p className={styles.error} role="alert">{error}</p>:null}
  <section className={styles.summary}><div><span>Matching feedback</span><strong>{total}</strong></div><div><span>Showing</span><strong>{items.length}</strong></div><p>Messages are private and can only be reviewed in Owner Studio. All times shown in Ontario time.</p></section>
  <section className={styles.filters} aria-label="Filter feedback">
   <div><strong>Status</strong><nav aria-label="Filter by status">{statuses.map(item=><Link aria-current={item===status?"page":undefined} key={item} href={linkFor(item,category)}>{item==="all"?"All":stateNames[item]}</Link>)}</nav></div>
   <div><strong>Type</strong><nav aria-label="Filter by feedback type">{categories.map(item=><Link aria-current={item===category?"page":undefined} key={item} href={linkFor(status,item)}>{item==="all"?"All":types[item]}</Link>)}</nav></div>
  </section>
  {!error?<section className={styles.list} aria-label="Feedback submissions">
   {items.map(item=><article className={styles.card} key={item.id}>
    <div className={styles.cardTop}><div className={styles.chips}><span className={styles.category} data-type={item.category}>{types[item.category]||"Feedback"}</span><span className={styles.state} data-state={item.status}>{stateNames[item.status]||"New"}</span></div><time dateTime={item.created_at}>{formattedDate(item.created_at)}</time></div>
    <p className={styles.message}>{item.message}</p>
    <div className={styles.context}><span><PodscapeLineIcon name="community"/> {names[item.user_id]||"PodScape member"}</span><span><PodscapeLineIcon name="arrow-right"/> Submitted on <Link href={safePage(item.page_path)}>{safePage(item.page_path)}</Link></span></div>
    {item.device_info?<details className={styles.details}><summary>Device details</summary><p>{item.device_info}</p></details>:null}
    <form action={updateFeedbackStatus} className={styles.actions}>
     <input type="hidden" name="id" value={item.id}/>
     <label>Progress<select name="status" defaultValue={item.status}><option value="new">New</option><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option></select></label>
     <label className={styles.ownerNote}>Private owner note<textarea name="owner_note" rows={2} maxLength={1000} defaultValue={item.owner_note||""} placeholder="Next steps, reproduce steps, or resolution notes…"/></label>
     <button type="submit">Save changes</button>
    </form>
   </article>)}
   {!items.length?<div className={styles.empty}><PodscapeLineIcon name="note"/><strong>No feedback here yet.</strong><p>As testers submit reports, they’ll appear in this desk.</p></div>:null}
   {total>pageSize?<nav className={styles.pagination} aria-label="Feedback pages">{pageNumber>1?<Link href={linkFor(status,category,pageNumber-1)}>← Newer</Link>:<span/>}<span>Page {pageNumber} / {Math.ceil(total/pageSize)}</span>{pageNumber*pageSize<total?<Link href={linkFor(status,category,pageNumber+1)}>Older →</Link>:<span/>}</nav>:null}
  </section>:null}
 </div></main>;
}
