"use server";

import { revalidatePath } from "next/cache";
import { isSpeciesRecordActive } from "@/data/species";
import { requireCustomerPreviewAccess } from "@/lib/customer-auth/access";
import { customerSupabase } from "@/lib/customer-auth/server";
import { getSpeciesRecords } from "@/lib/species-store";

export type CollectionMutationResult = { success: boolean; collected: boolean; error?: string };

/** A user can mutate only their own collection. The database repeats this guarantee with RLS. */
export async function setSpeciesCollected(speciesId: string, collected: boolean): Promise<CollectionMutationResult> {
  await requireCustomerPreviewAccess();
  if (typeof speciesId !== "string" || speciesId.length < 1 || speciesId.length > 120 || typeof collected !== "boolean") {
    return { success: false, collected: !collected, error: "Invalid species selection." };
  }

  const db = await customerSupabase();
  if (!db) return { success: false, collected: !collected, error: "Member accounts are not configured." };
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (authError || !user) return { success: false, collected: !collected, error: "Sign in to manage My Collection." };

  if (collected) {
    const eligible = (await getSpeciesRecords()).some(
      (record) => record.id === speciesId && record.kind === "species" && isSpeciesRecordActive(record),
    );
    if (!eligible) return { success: false, collected: false, error: "This species is not available in the Ledger." };

    const { error } = await db.from("member_species_collection")
      .insert({ user_id: user.id, species_id: speciesId });
    // A duplicate from another tab means the member already has this species.
    if (error && error.code !== "23505") {
      return { success: false, collected: false, error: "Couldn't add this species. Please try again." };
    }
  } else {
    const { error } = await db.from("member_species_collection")
      .delete().eq("user_id", user.id).eq("species_id", speciesId);
    if (error) return { success: false, collected: true, error: "Couldn't remove this species. Please try again." };
  }

  revalidatePath("/ledger", "layout");
  revalidatePath("/account");
  return { success: true, collected };
}
