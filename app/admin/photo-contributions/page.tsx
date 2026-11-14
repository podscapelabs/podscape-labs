import {redirect} from "next/navigation";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {getSupabaseAdmin} from "@/lib/supabase-admin";
import {OwnerDeskHeader} from "@/components/OwnerDeskFoundation";
import {PhotoReviewControls} from "@/components/PhotoReviewControls";
export const dynamic="force-dynamic";
export const metadata={title:"Photo Contributions | Owner Studio",robots:{index:false,follow:false}};
export default async function PhotoContributionsPage(){
 if(!(await isAdminAuthenticated()))redirect("/admin");
 const db=getSupabaseAdmin();
 const {data:photos,error}=db?await db.from("member_species_photos").select("id,species_id,storage_path,credit_type,credit_name,created_at").eq("moderation_status","pending").order("created_at",{ascending:true}).limit(60):{data:[],error:null};
 const rows=await Promise.all((photos||[]).map(async photo=>{
  const {data}=await db!.storage.from("member-species-photos").createSignedUrl(photo.storage_path,300);
  return {...photo,url:data?.signedUrl||""};
 }));
 return <main className="v2-container" style={{paddingBlock:24}}>
  <OwnerDeskHeader area="Leaf Ledger" title="Photo Contributions" description="Review keeper-submitted photos before they appear publicly." icon="creative" backHref="/account/owner-tools" backLabel="Owner Studio"/>
  <p>{error?"Unable to load review queue.":rows.length+" pending contributions"}</p>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16,marginBlock:20}}>
   {rows.map(photo=><article key={photo.id} style={{border:"1px solid currentColor",borderRadius:15,padding:16}}>
    {photo.url?<a target="_blank" rel="noreferrer" href={photo.url}><img src={photo.url} alt="Submitted photograph awaiting moderation" style={{width:"100%",aspectRatio:"1",objectFit:"contain"}}/></a>:<p>Image unavailable</p>}
    <p><strong>Species:</strong> {photo.species_id}</p>
    <p><strong>Credit:</strong> {photo.credit_type==="anonymous"?"Anonymous":photo.credit_name}</p>
    <PhotoReviewControls id={photo.id}/>
   </article>)}
  </div>
 </main>;
}
