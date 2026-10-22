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


/**
 * One-tap population adjustments for My Collection. If a species has active
 * enclosures, its primary bin is adjusted so the total and bin log stay in sync.
 * Without bins, only the collection quantity is changed. No notes/status changes.
 */
export async function adjustCollectedSpeciesQuantity(input: { speciesId: string; change: -1 | 1 }): Promise<{
  success: boolean;
  quantity?: number;
  error?: string;
}> {
  await requireCustomerPreviewAccess();
  if (typeof input.speciesId !== "string" || input.speciesId.length < 1 || input.speciesId.length > 120
    || (input.change !== -1 && input.change !== 1)) {
    return { success: false, error: "Invalid quantity adjustment." };
  }

  const db = await customerSupabase();
  if (!db) return { success: false, error: "Member accounts are not configured." };
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (authError || !user) return { success: false, error: "Sign in to update your collection." };

  const { data: owned, error: ownedError } = await db.from("member_species_collection")
    .select("quantity").eq("user_id", user.id).eq("species_id", input.speciesId).maybeSingle();
  if (ownedError || !owned) return { success: false, error: "Species not found in your collection." };

  const { data: bins, error: binsError } = await db.from("keeper_enclosures")
    .select("id,quantity,is_primary").eq("user_id", user.id).eq("species_id", input.speciesId).eq("is_archived", false);
  if (binsError) return { success: false, error: "Unable to load your bins. No changes made." };

  if (bins && bins.length) {
    const target = bins.find((bin) => bin.is_primary) || bins[0];
    const total = bins.reduce((sum, bin) => sum + bin.quantity, 0);
    const next = target.quantity + input.change;
    if (next < 0 || next > 99999 || total + input.change < 0) {
      return { success: false, error: "That quantity is outside the allowed range." };
    }
    const { data: updated, error } = await db.from("keeper_enclosures")
      .update({ quantity: next, updated_at: new Date().toISOString() })
      .eq("id", target.id).eq("user_id", user.id).eq("quantity", target.quantity)
      .select("id").maybeSingle();
    if (error || !updated) return { success: false, error: "Quantity changed elsewhere. Refresh and try again." };
    const { error: logError } = await db.from("keeper_events").insert({
      user_id: user.id, enclosure_id: target.id, kind: "inventory",
      note: "Quick quantity adjustment from My Collection", quantity_change: input.change,
    });
    if (logError) console.error("Couldn't log quick collection adjustment", { code: logError.code });
    revalidatePath("/keeper");
    revalidatePath("/ledger/my-collection");
    revalidatePath("/account");
    return { success: true, quantity: total + input.change };
  }

  const current = owned.quantity as number;
  const next = current + input.change;
  if (!Number.isInteger(current) || next < 1 || next > 9999) {
    return { success: false, error: "Collection quantity must stay between 1 and 9999." };
  }
  const { data: updated, error } = await db.from("member_species_collection")
    .update({ quantity: next, updated_at: new Date().toISOString() })
    .eq("user_id", user.id).eq("species_id", input.speciesId).eq("quantity", current)
    .select("quantity").maybeSingle();
  if (error || !updated) return { success: false, error: "Quantity changed elsewhere. Refresh and try again." };

  revalidatePath("/ledger/my-collection");
  revalidatePath("/account");
  return { success: true, quantity: next };
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
