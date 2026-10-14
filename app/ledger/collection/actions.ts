"use server";

import { revalidatePath } from "next/cache";
import { isColonyStatus, type ColonyStatus } from "@/data/collection";
import { isSpeciesRecordActive } from "@/data/species";
import { requireCustomerPreviewAccess } from "@/lib/customer-auth/access";
import { customerSupabase } from "@/lib/customer-auth/server";
import { getSpeciesRecords } from "@/lib/species-store";

export type CollectionMutationResult = { success: boolean; collected: boolean; error?: string };
export type CollectionDetailsResult = { success: boolean; error?: string };

export async function updateCollectionDetails(input: {
  speciesId: string;
  quantity: number;
  acquiredOn: string;
  colonyStatus: ColonyStatus;
  privateNotes: string;
}): Promise<CollectionDetailsResult> {
  await requireCustomerPreviewAccess();
  const quantity = Number(input.quantity);
  const acquiredOn = input.acquiredOn.trim();
  const privateNotes = input.privateNotes.trim();
  const validDate = acquiredOn === "" || (/^\d{4}-\d{2}-\d{2}$/.test(acquiredOn) && !Number.isNaN(Date.parse(`${acquiredOn}T00:00:00Z`)));
  if (typeof input.speciesId !== "string" || input.speciesId.length < 1 || input.speciesId.length > 120
    || !Number.isInteger(quantity) || quantity < 1 || quantity > 9999
    || !isColonyStatus(input.colonyStatus) || !validDate || privateNotes.length > 5000) {
    return { success: false, error: "Please review the keeper details and try again." };
  }

  const db = await customerSupabase();
  if (!db) return { success: false, error: "Member accounts are not configured." };
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (authError || !user) return { success: false, error: "Sign in to update your collection." };

  const { data, error } = await db.from("member_species_collection")
    .update({
      quantity,
      acquired_on: acquiredOn || null,
      colony_status: input.colonyStatus,
      private_notes: privateNotes,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("species_id", input.speciesId)
    .select("species_id")
    .maybeSingle();
  if (error || !data) return { success: false, error: "Couldn't save these keeper details. Please try again." };

  revalidatePath("/ledger", "layout");
  revalidatePath("/account");
  return { success: true };
}


/**
 * Update private keeper metadata without touching quantity.
 * The quick quantity stepper has its own isolated mutation, so saving older
 * notes or dates cannot overwrite a newly adjusted count.
 */
export async function updateCollectionKeeperMetadata(input: {
  speciesId: string;
  acquiredOn: string;
  colonyStatus: ColonyStatus;
  privateNotes: string;
}): Promise<CollectionDetailsResult> {
  await requireCustomerPreviewAccess();
  if (typeof input.speciesId !== "string" || input.speciesId.length < 1 || input.speciesId.length > 120
    || typeof input.acquiredOn !== "string" || typeof input.privateNotes !== "string") {
    return { success: false, error: "Please review the keeper details and try again." };
  }
  const acquiredOn = input.acquiredOn.trim();
  const privateNotes = input.privateNotes.trim();
  const validDate = acquiredOn === "" || (/^\d{4}-\d{2}-\d{2}$/.test(acquiredOn) && !Number.isNaN(Date.parse(`${acquiredOn}T00:00:00Z`)));
  if (!isColonyStatus(input.colonyStatus) || !validDate || privateNotes.length > 5000) {
    return { success: false, error: "Please review the keeper details and try again." };
  }
  const db = await customerSupabase();
  if (!db) return { success: false, error: "Member accounts are not configured." };
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (authError || !user) return { success: false, error: "Sign in to update your collection." };

  const { data, error } = await db.from("member_species_collection")
    .update({
      acquired_on: acquiredOn || null,
      colony_status: input.colonyStatus,
      private_notes: privateNotes,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("species_id", input.speciesId)
    .select("species_id")
    .maybeSingle();
  if (error || !data) return { success: false, error: "Couldn't save these keeper details. Please try again." };
  revalidatePath("/ledger", "layout");
  revalidatePath("/account");
  return { success: true };
}

/**
 * Adjust only the signed-in keeper's quantity. Unlike the full details form,
 * this cannot replace notes, dates, or colony status with stale card data.
 */
export async function updateCollectionQuantity(input: {
  speciesId: string;
  quantity: number;
}): Promise<{ success: boolean; quantity?: number; error?: string }> {
  await requireCustomerPreviewAccess();
  if (typeof input.speciesId !== "string" || input.speciesId.length < 1 || input.speciesId.length > 120
    || !Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 9999) {
    return { success: false, error: "Quantity must be a whole number from 1 to 9999." };
  }

  const db = await customerSupabase();
  if (!db) return { success: false, error: "Member accounts are not configured." };
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (authError || !user) return { success: false, error: "Sign in to update your collection." };

  const { data, error } = await db.from("member_species_collection")
    .update({ quantity: input.quantity, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("species_id", input.speciesId)
    .select("quantity")
    .maybeSingle();

  if (error || !data) return { success: false, error: "Couldn't update the quantity. Please try again." };
  revalidatePath("/ledger", "layout");
  revalidatePath("/account");
  return { success: true, quantity: data.quantity as number };
}

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
