import "server-only";

import type { ColonyStatus } from "@/data/collection";
import { customerSupabase } from "@/lib/customer-auth/server";

type MemberDatabase = NonNullable<Awaited<ReturnType<typeof customerSupabase>>>;

export type MemberCollectionEntry = {
  speciesId: string;
  addedAt: string;
  quantity: number;
  acquiredOn: string | null;
  colonyStatus: ColonyStatus;
  privateNotes: string;
  updatedAt: string;
};

/** Return the signed-in member's private selections with their collection dates. */
export async function getMemberCollectionEntries(db: MemberDatabase, userId: string): Promise<MemberCollectionEntry[]> {
  const { data, error } = await db
    .from("member_species_collection")
    .select("species_id,added_at,quantity,acquired_on,colony_status,private_notes,updated_at")
    .eq("user_id", userId)
    .order("added_at", { ascending: false });
  if (error) {
    console.error("Member collection query failed", { code: error.code, message: error.message, details: error.details });
    throw new Error("Unable to load My Collection right now.");
  }
  return (data || []).map((row) => ({
    speciesId: row.species_id as string,
    addedAt: row.added_at as string,
    quantity: row.quantity as number,
    acquiredOn: row.acquired_on as string | null,
    colonyStatus: row.colony_status as ColonyStatus,
    privateNotes: row.private_notes as string,
    updatedAt: row.updated_at as string,
  }));
}

/** Only return the IDs of the verified, currently signed-in member. */
export async function getMemberSpeciesIds(db: MemberDatabase, userId: string): Promise<string[]> {
  return (await getMemberCollectionEntries(db, userId)).map((entry) => entry.speciesId);
}

export async function getMemberCollectionState(): Promise<{ signedIn: boolean; ids: string[]; entries: MemberCollectionEntry[] }> {
  const db = await customerSupabase();
  if (!db) return { signedIn: false, ids: [], entries: [] };
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { signedIn: false, ids: [], entries: [] };
  const entries = await getMemberCollectionEntries(db, user.id);
  return { signedIn: true, ids: entries.map((entry) => entry.speciesId), entries };
}
