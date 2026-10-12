import "server-only";

import { customerSupabase } from "@/lib/customer-auth/server";

type MemberDatabase = NonNullable<Awaited<ReturnType<typeof customerSupabase>>>;

/** Only return the IDs of the verified, currently signed-in member. */
export async function getMemberSpeciesIds(db: MemberDatabase, userId: string): Promise<string[]> {
  const { data, error } = await db
    .from("member_species_collection")
    .select("species_id")
    .eq("user_id", userId);
  if (error) throw new Error("Unable to load My Collection right now.");
  return (data || []).map((row) => row.species_id as string);
}

export async function getMemberCollectionState(): Promise<{ signedIn: boolean; ids: string[] }> {
  const db = await customerSupabase();
  if (!db) return { signedIn: false, ids: [] };
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { signedIn: false, ids: [] };
  return { signedIn: true, ids: await getMemberSpeciesIds(db, user.id) };
}
