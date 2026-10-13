"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCollectionDetails } from "@/app/ledger/collection/actions";
import { colonyStatusLabels, colonyStatuses, type ColonyStatus } from "@/data/collection";
import type { MemberCollectionEntry } from "@/lib/member-collection";
import styles from "./CollectionDetailsForm.module.css";

export function CollectionDetailsForm({ entry }: { entry: MemberCollectionEntry }) {
  const [quantity, setQuantity] = useState(entry.quantity);
  const [acquiredOn, setAcquiredOn] = useState(entry.acquiredOn || "");
  const [colonyStatus, setColonyStatus] = useState<ColonyStatus>(entry.colonyStatus);
  const [privateNotes, setPrivateNotes] = useState(entry.privateNotes);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function save() {
    setMessage("");
    startTransition(async () => {
      const result = await updateCollectionDetails({ speciesId: entry.speciesId, quantity, acquiredOn, colonyStatus, privateNotes });
      setIsError(!result.success);
      setMessage(result.success ? "Private keeper details saved." : result.error || "Unable to save.");
      if (result.success) router.refresh();
    });
  }

  return <section className={styles.panel} aria-labelledby="private-keeper-record-title">
    <div className={styles.heading}>
      <div><p>My Collection · Private</p><h2 id="private-keeper-record-title">Keeper record</h2></div>
      <span>Only visible in your account</span>
    </div>
    <div className={styles.grid}>
      <label><span>Quantity</span><input type="number" min="1" max="9999" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} /></label>
      <label><span>Acquired on</span><input type="date" value={acquiredOn} onChange={(event) => setAcquiredOn(event.target.value)} /></label>
      <label><span>Colony status</span><select value={colonyStatus} onChange={(event) => setColonyStatus(event.target.value as ColonyStatus)}>{colonyStatuses.map((status) => <option value={status} key={status}>{colonyStatusLabels[status]}</option>)}</select></label>
      <label className={styles.notes}><span>Private notes</span><textarea rows={6} maxLength={5000} value={privateNotes} onChange={(event) => setPrivateNotes(event.target.value)} placeholder="Observations, source details, breeding notes, or reminders…" /><small>{privateNotes.length} / 5000</small></label>
    </div>
    <div className={styles.footer}>
      <p className={isError ? styles.error : ""} role="status">{message || "Saved separately from the public Leaf Ledger record."}</p>
      <button type="button" onClick={save} disabled={pending}>{pending ? "Saving…" : "Save keeper record"}</button>
    </div>
  </section>;
}
