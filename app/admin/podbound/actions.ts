"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {cardCategories,getPodBoundCard,requireCardDatabase} from "@/lib/podbound-cards";

function value(form:FormData,key:string,max=4000){return String(form.get(key)||"").trim().slice(0,max);}
function editorRedirect(id:string,key:"saved"|"error",message="1"):never{
  redirect("/admin/podbound/"+encodeURIComponent(id)+"?"+new URLSearchParams({[key]:message}));
}
export async function createPodBoundCard(){
  if(!await isAdminAuthenticated())redirect("/admin");
  const db=requireCardDatabase();
  const {data,error}=await db.from("podbound_cards").insert({title:"Untitled card",status:"draft"}).select("id").single();
  if(error||!data)throw new Error(error?.message||"Unable to create card");
  revalidatePath("/admin/podbound");
  redirect("/admin/podbound/"+data.id+"?created=1");
}
async function uploadArtwork(id:string,file:File,kind:"core"|"alternate"){
  if(file.size>10*1024*1024)throw new Error("Artwork must be 10 MB or smaller.");
  const mimeExt:Record<string,string>={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/avif":"avif"};
  const ext=mimeExt[file.type];
  if(!ext)throw new Error("Upload a JPG, PNG, WebP or AVIF image.");
  const db=requireCardDatabase();
  const path=id+"/"+kind+"-"+crypto.randomUUID()+"."+ext;
  const {error}=await db.storage.from("podbound-art").upload(path,await file.arrayBuffer(),{contentType:file.type,upsert:false});
  if(error)throw new Error("Artwork upload failed: "+error.message);
  return path;
}
export async function savePodBoundCard(form:FormData){
  if(!await isAdminAuthenticated())redirect("/admin");
  const id=value(form,"id",100);
  const current=await getPodBoundCard(id);
  if(!current)redirect("/admin/podbound");
  const title=value(form,"title",180);
  const category=value(form,"category",30);
  const status=value(form,"status",20);
  if(!title)editorRedirect(id,"error","A card name is required.");
  if(!cardCategories.includes(category as typeof cardCategories[number]))editorRedirect(id,"error","Choose a valid card category.");
  if(!["draft","published","archived"].includes(status))editorRedirect(id,"error","Invalid card status.");
  const speciesId=value(form,"species_record_id",120)||null;
  if(speciesId){
    const db=requireCardDatabase();
    const {data,error}=await db.from("species_records").select("id").eq("id",speciesId).maybeSingle();
    if(error||!data)editorRedirect(id,"error","Choose a valid Leaf Ledger species.");
  }
  let core=current.core_art_path, alternate=current.alternate_art_path;
  try{
    for(const [field,kind] of [["core_art","core"],["alternate_art","alternate"]] as const){
      const file=form.get(field);
      if(file instanceof File && file.size>0){
        const result=await uploadArtwork(id,file,kind);
        if(kind==="core")core=result;else alternate=result;
      }
    }
  }catch(error){editorRedirect(id,"error",error instanceof Error?error.message:"Artwork upload failed.");}
  if(form.get("remove_core")==="yes")core=null;
  if(form.get("remove_alternate")==="yes")alternate=null;
  const db=requireCardDatabase();
  const {error}=await db.from("podbound_cards").update({
    title,card_number:value(form,"card_number",40),set_name:value(form,"set_name",100)||"Core Set",
    category,status,featured:form.get("featured")==="yes",species_record_id:speciesId,
    summary:value(form,"summary",1500),ability_text:value(form,"ability_text",6000),
    gameplay_notes:value(form,"gameplay_notes",6000),biology_notes:value(form,"biology_notes",6000),
    rules_version:value(form,"rules_version",80),artist_name:value(form,"artist_name",120),
    core_art_path:core,alternate_art_path:alternate,
    core_art_alt:value(form,"core_art_alt",240),alternate_art_alt:value(form,"alternate_art_alt",240),
    updated_at:new Date().toISOString()
  }).eq("id",id);
  if(error)editorRedirect(id,"error",error.message);
  revalidatePath("/admin/podbound");revalidatePath("/admin/podbound/"+id);
  editorRedirect(id,"saved");
}
export async function archivePodBoundCard(form:FormData){
  if(!await isAdminAuthenticated())redirect("/admin");
  const id=value(form,"id",100);
  const current=await getPodBoundCard(id);
  if(!current)redirect("/admin/podbound");
  const db=requireCardDatabase();
  const {error}=await db.from("podbound_cards").update({status:current.status==="archived"?"draft":"archived",updated_at:new Date().toISOString()}).eq("id",id);
  if(error)editorRedirect(id,"error",error.message);
  revalidatePath("/admin/podbound");
  redirect("/admin/podbound");
}
