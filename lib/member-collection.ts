import "server-only";

import { customerSupabase } from "@/lib/customer-auth/server";

type MemberDatabase = NonNullable<Awaited<ReturnType<typeof customerSupabase>>>;

export type MemberCollectionEntry = {
  speciesId: string;
  addedAt: string;
};

/** Return the signed-in member's private selections with their collection dates. */
export async function getMemberCollectionEntries(db: MemberDatabase, userId: string): Promise<MemberCollectionEntry[]> {
  const { data, error } = await db
    .from("member_species_collection")
    .select("species_id,added_at")
    .eq("user_id", userId)
    .order("added_at", { ascending: false });
  if (error) throw new Error("Unable to load My Collection right now.");
  return (data || []).map((row) => ({
    speciesId: row.species_id as string,
    addedAt: row.added_at as string,
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
