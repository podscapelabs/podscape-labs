"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCollectionQuantity } from "@/app/ledger/collection/actions";
import styles from "./CollectionRows.module.css";

const MIN = 1;
const MAX = 9999;

export function CollectionQuantityControl({ speciesId, speciesName, initialQuantity }: {
  speciesId: string;
  speciesName: string;
  initialQuantity: number;
}) {
  const [saved, setSaved] = useState(initialQuantity);
  const [draft, setDraft] = useState(String(initialQuantity));
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const saving = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (!saving.current) {
      setSaved(initialQuantity);
      setDraft(String(initialQuantity));
    }
  }, [initialQuantity]);

  function save(next: number) {
    if (saving.current) return;
    if (!Number.isInteger(next) || next < MIN || next > MAX) {
      setError("Enter a whole number from 1 to 9999.");
      return;
    }
    setError("");
    if (next === saved) {
      setDraft(String(saved));
      return;
    }

    const before = saved;
    saving.current = true;
    setSaved(next);
    setDraft(String(next));
    startTransition(async () => {
      try {
        const result = await updateCollectionQuantity({ speciesId, quantity: next });
        if (!result.success) {
          setSaved(before);
          setDraft(String(before));
          setError(result.error || "Couldn't save the quantity.");
        } else {
          const confirmed = result.quantity ?? next;
          setSaved(confirmed);
          setDraft(String(confirmed));
          router.refresh();
        }
      } catch {
        setSaved(before);
        setDraft(String(before));
        setError("Couldn't save the quantity. Try again.");
      } finally {
        saving.current = false;
      }
    });
  }

  const parsed = Number(draft);
  const dirty = draft !== String(saved);
  const valid = draft.trim() !== "" && Number.isInteger(parsed) && parsed >= MIN && parsed <= MAX;

  return <div className={styles.quantityGroup}>
    <span className={styles.quantityLabel}>Qty</span>
    <div className={styles.stepper}>
      <button type="button" aria-label={`Decrease quantity for ${speciesName}`}
        onClick={() => save(saved - 1)} disabled={pending || saved <= MIN}>−</button>
      <input type="number" inputMode="numeric" min={MIN} max={MAX} step="1" value={draft}
        aria-label={`Quantity of ${speciesName}`} disabled={pending}
        onChange={(event) => { setDraft(event.target.value); setError(""); }}
        onKeyDown={(event) => {
          if (event.key === "Enter") { event.preventDefault(); save(Number(draft)); }
          if (event.key === "Escape") { setDraft(String(saved)); setError(""); }
        }} />
      <button type="button" aria-label={`Increase quantity for ${speciesName}`}
        onClick={() => save(saved + 1)} disabled={pending || saved >= MAX}>+</button>
      {dirty ? <button type="button" className={styles.saveQty} onClick={() => save(parsed)}
        disabled={pending || !valid} aria-label={`Save quantity for ${speciesName}`}>Save</button> : null}
    </div>
    <span className={styles.screenReader} role="status" aria-live="polite">{pending ? "Saving quantity" : error || `Saved quantity ${saved}`}</span>
    {error ? <span className={styles.quantityError} role="alert">{error}</span> : null}
  </div>;
}
