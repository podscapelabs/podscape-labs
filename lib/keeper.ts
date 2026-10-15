import "server-only";
import { customerSupabase } from "@/lib/customer-auth/server";

export type Enclosure = {
 id: string; speciesId: string; name: string; label: string; quantity: number;
 status: string; breeding: string; enclosureType: string; notes: string;
 acquiredOn: string | null; source: string; isPrimary: boolean; isArchived: boolean;
 createdAt: string; updatedAt: string;
};
export type KeeperEvent = { id: string; kind: string; note: string; createdAt: string; quantityChange: number | null };
export type KeeperEventPage = { events: KeeperEvent[]; page: number; pageSize: number; total: number; hasNext: boolean };

export async function keeperContext() {
 const db = await customerSupabase();
 if (!db) return { db: null, user: null };
 const { data: { user } } = await db.auth.getUser();
 return { db, user };
}
export async function listEnclosures(): Promise<Enclosure[]> {
 const { db, user } = await keeperContext();
 if (!db || !user) return [];
 const { data, error } = await db.from("keeper_enclosures").select("*").eq("user_id", user.id).order("is_archived", { ascending: true }).order("created_at", { ascending: true });
 if (error) throw new Error("Keeper storage is unavailable. Apply the Keeper migration to the customer database.");
 return (data || []).map(mapEnclosure);
}
export function mapEnclosure(row: Record<string, unknown>): Enclosure {
 return { id: String(row.id), speciesId: String(row.species_id), name: String(row.name),
  label: String(row.label || ""), quantity: Number(row.quantity), status: String(row.status),
  breeding: String(row.breeding), enclosureType: String(row.enclosure_type || ""),
  acquiredOn: row.acquired_on ? String(row.acquired_on) : null, source: String(row.source || ""),
  notes: String(row.notes || ""), isPrimary: Boolean(row.is_primary), isArchived: Boolean(row.is_archived),
  createdAt: String(row.created_at), updatedAt: String(row.updated_at) };
}
export async function getEnclosure(id: string): Promise<{ enclosure: Enclosure; events: KeeperEvent[] } | null> {
 const { db, user } = await keeperContext();
 if (!db || !user) return null;
 const { data } = await db.from("keeper_enclosures").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
 if (!data) return null;
 const { data: events } = await db.from("keeper_events").select("id,kind,note,quantity_change,created_at").eq("enclosure_id", id).eq("user_id", user.id).order("created_at", { ascending: false }).limit(30);
 return { enclosure: mapEnclosure(data), events: (events || []).map(row => ({ id: row.id, kind: row.kind, note: row.note, quantityChange: row.quantity_change, createdAt: row.created_at })) };
}
export async function getEnclosureEvents(id:string,page=1,pageSize=30):Promise<KeeperEventPage|null>{
 const {db,user}=await keeperContext();if(!db||!user)return null;
 const safePage=Number.isInteger(page)&&page>0?page:1;const safeSize=Math.min(Math.max(pageSize,1),50);
 const {data:owner}=await db.from("keeper_enclosures").select("id").eq("id",id).eq("user_id",user.id).maybeSingle();
 if(!owner)return null;
 const from=(safePage-1)*safeSize;const to=from+safeSize-1;
 const {data,error,count}=await db.from("keeper_events").select("id,kind,note,quantity_change,created_at",{count:"exact"}).eq("enclosure_id",id).eq("user_id",user.id).order("created_at",{ascending:false}).range(from,to);
 if(error)throw new Error("Unable to load care history.");
 const events=(data||[]).map(row=>({id:row.id,kind:row.kind,note:row.note,quantityChange:row.quantity_change,createdAt:row.created_at}));
 const total=count||0;
 return{events,page:safePage,pageSize:safeSize,total,hasNext:from+events.length<total};
}
