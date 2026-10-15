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
 const { data, error } = await db.from("keeper_enclosures").insert({ user_id:user.id,species_id:input.speciesId,name }).select("id").single();
 if (error || !data) return { success:false,error:"Couldn't create enclosure. Keeper database migration may be required." };
 revalidatePath("/keeper"); revalidatePath("/ledger/my-collection"); return { success:true,id:data.id };
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
 const {error}=await db.from("keeper_events").insert({user_id:user.id,enclosure_id:input.id,kind:input.kind,note:input.note.trim(),...(input.occurredOn?{created_at:input.occurredOn+"T12:00:00Z"}:{})});
 if(error) return {success:false,error:"Couldn't log the activity."};
 revalidatePath("/keeper/"+input.id);return {success:true};
}
