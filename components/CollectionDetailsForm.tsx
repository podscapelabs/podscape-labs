"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updateCollectionKeeperMetadata } from "@/app/ledger/collection/actions";
import { colonyStatusLabels, colonyStatuses, type ColonyStatus } from "@/data/collection";
import type { MemberCollectionEntry } from "@/lib/member-collection";
import { CollectionButton } from "./CollectionButton";
import { CollectionQuantityControl } from "./CollectionQuantityControl";
import styles from "./CollectionDetailsForm.module.css";

export function CollectionDetailsForm({ entry, speciesName }: { entry: MemberCollectionEntry; speciesName: string }) {
  const [acquiredOn, setAcquiredOn] = useState(entry.acquiredOn || "");
  const [colonyStatus, setColonyStatus] = useState<ColonyStatus>(entry.colonyStatus);
  const [privateNotes, setPrivateNotes] = useState(entry.privateNotes);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    startTransition(async () => {
      try {
        // Quantity is deliberately updated separately by the quick stepper.
        // Never save a stale quantity when editing acquired date, status or notes.
        const result = await updateCollectionKeeperMetadata({
          speciesId: entry.speciesId, acquiredOn, colonyStatus, privateNotes,
        });
        setIsError(!result.success);
        setMessage(result.success ? "Private keeper details saved." : result.error || "Unable to save.");
        if (result.success) router.refresh();
      } catch {
        setIsError(true);
        setMessage("Unable to save. Please try again.");
      }
    });
  }

  return <section className={styles.panel} aria-label="Your private collection record">
    <div className={styles.top}>
      <div className={styles.topLabel}>
        <strong>In your collection</strong><span>Private</span>
      </div>
      <div className={styles.quick}>
        <CollectionQuantityControl speciesId={entry.speciesId} speciesName={speciesName} initialQuantity={entry.quantity} />
        <span className={styles.status} data-status={colonyStatus}> {colonyStatusLabels[colonyStatus]}</span>
      </div>
    </div>
    <details className={styles.disclosure} id="keeper-details">
      <summary>
        <span>Keeper details</span>
        <span className={styles.hint}>Date, status &amp; notes</span>
        <span className={styles.chevron} aria-hidden="true">⌄</span>
      </summary>
      <form onSubmit={save}>
        <div className={styles.grid}>
          <label>
            <span>Acquired on</span>
            <input type="date" value={acquiredOn} onChange={(event) => { setAcquiredOn(event.target.value); setMessage(""); }} />
          </label>
          <label>
            <span>Colony status</span>
            <select value={colonyStatus} onChange={(event) => { setColonyStatus(event.target.value as ColonyStatus); setMessage(""); }}>
              {colonyStatuses.map((status) => <option value={status} key={status}>{colonyStatusLabels[status]}</option>)}
            </select>
          </label>
          <label className={styles.notes}>
            <span>Private notes</span>
            <textarea rows={3} maxLength={5000} value={privateNotes} onChange={(event) => { setPrivateNotes(event.target.value); setMessage(""); }} placeholder="Observations, source, breeding notes…" />
            <small>{privateNotes.length} / 5000</small>
          </label>
        </div>
        <div className={styles.footer}>
          <span className={isError ? styles.error : styles.feedback} role={isError ? "alert" : "status"} aria-live="polite">{message || "Only you can see these details."}</span>
          <button type="submit" disabled={pending}>{pending ? "Saving…" : "Save details"}</button>
        </div>
      </form>
      <div className={styles.remove}>
        <span>Collection management</span>
        <CollectionButton speciesId={entry.speciesId} speciesName={speciesName} initialCollected signedIn detail />
      </div>
    </details>
  </section>;
}
