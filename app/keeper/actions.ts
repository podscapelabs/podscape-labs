"use server";
import { revalidatePath } from "next/cache";
import { keeperContext } from "@/lib/keeper";
import { requireCustomerPreviewAccess } from "@/lib/customer-auth/access";
import { getSpeciesRecords } from "@/lib/species-store";

type Result = { success: boolean; error?: string; id?: string };
const statuses = ["planning","establishing","stable","thriving","declining","no-longer-kept"];
const breedingValues = ["unknown","not-observed","observed","active"];
const eventKinds = ["feeding","maintenance","breeding","observation","inventory"];

export async function createEnclosure(input: { speciesId: string; name: string }): Promise<Result> {
 await requireCustomerPreviewAccess();
 const name = input.name?.trim();
 if (!name || name.length > 80 || !input.speciesId || input.speciesId.length > 120) return { success:false,error:"Provide an enclosure name." };
 const available = (await getSpeciesRecords()).some(x => x.id === input.speciesId && x.kind === "species");
 if (!available) return { success:false,error:"Choose a species from the Leaf Ledger." };
 const { db, user } = await keeperContext();
 if (!db || !user) return { success:false,error:"Sign in to manage your enclosures." };
 // Creating a bin intentionally also saves its species if needed. Merely
 // bookmarking a species never creates a physical enclosure.
 const {data:saved,error:lookupError}=await db.from("member_species_collection").select("species_id").eq("user_id",user.id).eq("species_id",input.speciesId).maybeSingle();
 if(lookupError)return{success:false,error:"Could not check your species collection."};
 if(!saved){
  const {error:saveError}=await db.from("member_species_collection").insert({user_id:user.id,species_id:input.speciesId});
  if(saveError&&saveError.code!=="23505")return{success:false,error:"Could not add this species to your collection."};
 }
 const { data, error } = await db.from("keeper_enclosures").insert({ user_id:user.id,species_id:input.speciesId,name }).select("id").single();
 // On a failed bin creation, do not silently leave behind a surprise bookmark.
 // Retain a concurrent user's bookmark if another request already created it.

 if (error || !data) return { success:false,error:"Couldn't create enclosure. Keeper database migration may be required." };
 revalidatePath("/keeper"); revalidatePath("/keeper/collection"); revalidatePath("/ledger","layout"); return { success:true,id:data.id };
}
export async function updateEnclosure(input: { id:string; name:string; label:string; quantity:number; status:string; breeding:string; enclosureType:string; acquiredOn:string; source:string; notes:string }):Promise<Result> {
 await requireCustomerPreviewAccess();
 const validDate = input.acquiredOn === "" || /^\d{4}-\d{2}-\d{2}$/.test(input.acquiredOn);
 if (!input.id || !input.name?.trim() || input.name.length > 80 || input.label.length > 70 || !Number.isInteger(input.quantity) || input.quantity < 0 || input.quantity > 99999 || !statuses.includes(input.status) || !breedingValues.includes(input.breeding) || input.enclosureType.length > 120 || !validDate || input.source.length > 300 || input.notes.length > 5000) return {success:false,error:"Review your enclosure details."};
 const { db, user } = await keeperContext(); if (!db || !user) return {success:false,error:"Sign in first."};
 const { data: old } = await db.from("keeper_enclosures").select("quantity").eq("id",input.id).eq("user_id",user.id).maybeSingle();
 if (!old) return {success:false,error:"Enclosure not found."};
 const { data,error } = await db.from("keeper_enclosures").update({ name:input.name.trim(),label:input.label.trim(),quantity:input.quantity,status:input.status,breeding:input.breeding,enclosure_type:input.enclosureType.trim(),acquired_on:input.acquiredOn||null,source:input.source.trim(),notes:input.notes.trim(),updated_at:new Date().toISOString() }).eq("id",input.id).eq("user_id",user.id).select("id").maybeSingle();
 if (error || !data) return {success:false,error:"Couldn't save enclosure."};
 if (old.quantity !== input.quantity) await db.from("keeper_events").insert({user_id:user.id,enclosure_id:input.id,kind:"inventory",note:"Population updated",quantity_change:input.quantity-old.quantity});
 revalidatePath("/keeper"); revalidatePath("/keeper/"+input.id); revalidatePath("/account"); revalidatePath("/ledger/my-collection"); return {success:true};
}
export async function setEnclosureArchived(input:{id:string;archived:boolean}):Promise<Result>{
 await requireCustomerPreviewAccess();
 if(!/^[a-f0-9-]{36}$/i.test(input.id)||typeof input.archived!=="boolean")return{success:false,error:"Invalid enclosure."};
 const {db,user}=await keeperContext();if(!db||!user)return{success:false,error:"Sign in first."};
 const {data,error}=await db.from("keeper_enclosures").update({is_archived:input.archived,updated_at:new Date().toISOString()}).eq("id",input.id).eq("user_id",user.id).select("id").maybeSingle();
 if(error||!data)return{success:false,error:"Couldn't update this enclosure."};
 revalidatePath("/keeper");revalidatePath("/keeper/"+input.id);revalidatePath("/account");revalidatePath("/ledger/my-collection");return{success:true};
}
export async function logKeeperEvent(input:{ id:string; kind:string; note:string; occurredOn?:string }):Promise<Result> {
 await requireCustomerPreviewAccess();
 if (!input.id || !eventKinds.includes(input.kind) || !input.note?.trim() || input.note.length > 1500) return {success:false,error:"Choose an activity and add a short note."};
 if(input.occurredOn && (!/^\d{4}-\d{2}-\d{2}$/.test(input.occurredOn)||!Number.isFinite(Date.parse(input.occurredOn+"T12:00:00Z"))||input.occurredOn>new Date().toISOString().slice(0,10)))return {success:false,error:"Choose a valid date that is not in the future."};
 const { db,user }=await keeperContext(); if(!db || !user) return {success:false,error:"Sign in first."};
 const { data: owner }=await db.from("keeper_enclosures").select("id").eq("id",input.id).eq("user_id",user.id).maybeSingle();
 if(!owner) return {success:false,error:"Enclosure not found."};
 const {data:event,error}=await db.from("keeper_events").insert({user_id:user.id,enclosure_id:input.id,kind:input.kind,note:input.note.trim(),...(input.occurredOn?{created_at:input.occurredOn+"T12:00:00Z"}:{})}).select("id").single();
 if(error||!event) return {success:false,error:"Couldn't log the activity."};
 revalidatePath("/keeper/"+input.id);revalidatePath("/keeper");revalidatePath("/keeper/activity");return {success:true,id:event.id};
}

/** Undo a care entry created in the active Quick Care session. Ownership is checked server-side. */
export async function undoKeeperEvent(input:{id:string;enclosureId:string}):Promise<Result>{
 await requireCustomerPreviewAccess();
 if(!/^[a-f\d-]{36}$/i.test(input.id)||!/^[a-f\d-]{36}$/i.test(input.enclosureId))return{success:false,error:"Invalid care entry."};
 const {db,user}=await keeperContext();if(!db||!user)return{success:false,error:"Sign in first."};
 const {data,error}=await db.from("keeper_events").delete().eq("id",input.id).eq("enclosure_id",input.enclosureId).eq("user_id",user.id).in("kind",["maintenance","feeding","observation"]).select("id").maybeSingle();
 if(error||!data)return{success:false,error:"Could not undo this entry. Refresh your care history."};
 revalidatePath("/keeper/"+input.enclosureId);revalidatePath("/keeper");revalidatePath("/keeper/activity");
 return{success:true};
}

type BatchResult={success:boolean;error?:string;events?:{id:string;enclosureId:string}[]};
/** Save one independent maintenance record per selected, active enclosure. */
export async function logKeeperEventBatch(input:{ids:string[];kind:string;note:string}):Promise<BatchResult>{
 await requireCustomerPreviewAccess();
 const ids=[...new Set(input.ids||[])];
 if(ids.length<1||ids.length>500||ids.some(id=>!/^[a-f0-9-]{36}$/i.test(id))||
  !["feeding","maintenance"].includes(input.kind)||!["Misted","Fed","Spot cleaned","Leaf litter added"].includes(input.note))
  return{success:false,error:"Select up to 500 bins and a valid care action."};
 const {db,user}=await keeperContext();if(!db||!user)return{success:false,error:"Sign in first."};
 const {data:owned,error:checkError}=await db.from("keeper_enclosures").select("id").eq("user_id",user.id).eq("is_archived",false).in("id",ids);
 if(checkError||!owned||owned.length!==ids.length)return{success:false,error:"Some selected bins are no longer active or do not belong to you."};
 const timestamp=new Date().toISOString();
 const {data,error}=await db.from("keeper_events").insert(ids.map(id=>({user_id:user.id,enclosure_id:id,kind:input.kind,note:input.note,created_at:timestamp}))).select("id,enclosure_id");
 if(error||!data||data.length!==ids.length)return{success:false,error:"Could not save batch care. Check your care history before retrying."};
 revalidatePath("/keeper");revalidatePath("/keeper/activity");
 for(const id of ids)revalidatePath("/keeper/"+id);
 return{success:true,events:data.map(row=>({id:String(row.id),enclosureId:String(row.enclosure_id)}))};
}

/** Undo every record from one successful multi-care operation, never other keepers' entries. */
export async function undoKeeperEventBatch(input:{eventIds:string[]}):Promise<Result>{
 await requireCustomerPreviewAccess();
 const ids=[...new Set(input.eventIds||[])];
 if(!ids.length||ids.length>500||ids.some(id=>!/^[a-f0-9-]{36}$/i.test(id)))return{success:false,error:"Invalid batch."};
 const {db,user}=await keeperContext();if(!db||!user)return{success:false,error:"Sign in first."};
 const {data:owned,error:checkError}=await db.from("keeper_events").select("id,enclosure_id").eq("user_id",user.id)
  .in("id",ids).in("kind",["feeding","maintenance"]);
 if(checkError||!owned||owned.length!==ids.length)return{success:false,error:"The original batch could not be verified."};
 const {data:removed,error}=await db.from("keeper_events").delete().eq("user_id",user.id).in("id",ids).select("id");
 if(error||!removed||removed.length!==ids.length)return{success:false,error:"Undo incomplete. Refresh your history before trying again."};
 revalidatePath("/keeper");revalidatePath("/keeper/activity");
 for(const id of new Set(owned.map(row=>String(row.enclosure_id))))revalidatePath("/keeper/"+id);
 return{success:true};
}
