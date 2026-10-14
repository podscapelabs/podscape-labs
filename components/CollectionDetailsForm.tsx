"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updateCollectionKeeperMetadata } from "@/app/ledger/collection/actions";
import { colonyStatusLabels, colonyStatuses, type ColonyStatus } from "@/data/collection";
import type { MemberCollectionEntry } from "@/lib/member-collection";
import { CollectionButton } from "./CollectionButton";
import { CollectionQuantityControl } from "./CollectionQuantityControl";
import styles from "./CollectionDetailsForm.module.css";

type CareSpec = { label: string; value: string };

export function CollectionDetailsForm({ entry, speciesName, careSpecs = [] }: {
  entry: MemberCollectionEntry;
  speciesName: string;
  careSpecs?: CareSpec[];
}) {
  const [acquiredOn, setAcquiredOn] = useState(entry.acquiredOn || "");
  const [colonyStatus, setColonyStatus] = useState<ColonyStatus>(entry.colonyStatus);
  const [privateNotes, setPrivateNotes] = useState(entry.privateNotes);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const recordedDate = entry.updatedAt ? new Date(entry.updatedAt) : null;
  const lastUpdated = recordedDate && !Number.isNaN(recordedDate.valueOf())
    ? recordedDate.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : "Not recorded";

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    startTransition(async () => {
      try {
        // Quantity is deliberately updated separately by the quick stepper.
        const result = await updateCollectionKeeperMetadata({
          speciesId: entry.speciesId, acquiredOn, colonyStatus, privateNotes,
        });
        setIsError(!result.success);
        setMessage(result.success ? "Keeper record saved." : result.error || "Unable to save.");
        if (result.success) router.refresh();
      } catch {
        setIsError(true);
        setMessage("Unable to save. Please try again.");
      }
    });
  }

  return <section className={styles.panel} aria-label={`Private colony dashboard for ${speciesName}`}>
    <div className={styles.header}>
      <div>
        <p className={styles.eyebrow}>Your colony · Private keeper record</p>
        <h2>Colony dashboard</h2>
      </div>
      <span className={styles.private}>Only visible to you</span>
    </div>

    <div className={styles.metrics}>
      <div className={styles.metric}>
        <span className={styles.metricLabel}>Population</span>
        <CollectionQuantityControl speciesId={entry.speciesId} speciesName={speciesName} initialQuantity={entry.quantity} />
        <small>Recorded count · adjust anytime</small>
      </div>
      <div className={styles.metric}>
        <span className={styles.metricLabel}>Colony condition</span>
        <strong className={styles.status} data-status={colonyStatus}>{colonyStatusLabels[colonyStatus]}</strong>
        <small>Keeper-reported status</small>
      </div>
    </div>

    <div className={styles.snapshot}>
      <div><span>Acquired</span><strong>{acquiredOn || "Not recorded"}</strong></div>
      <div><span>Last record update</span><strong>{lastUpdated}</strong></div>
    </div>

    {careSpecs.length > 0 ? <div className={styles.careSection}>
      <div className={styles.sectionHeader}>
        <h3>Species care reference</h3>
        <span>Leaf Ledger guidance, not measured conditions</span>
      </div>
      <dl className={styles.specGrid}>
        {careSpecs.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
    </div> : null}

    <div className={styles.notesSection}>
      <div className={styles.sectionHeader}><h3>Keeper observations</h3><span>Private notes</span></div>
      {privateNotes.trim()
        ? <p className={styles.notePreview}>{privateNotes}</p>
        : <p className={styles.empty}>No observations recorded yet. Add notes about breeding, feeding, habitat or colony changes.</p>}
    </div>

    <details className={styles.disclosure} id="keeper-details">
      <summary><span>Edit colony record</span><span className={styles.hint}>Status, date &amp; observations</span><span className={styles.chevron} aria-hidden="true">⌄</span></summary>
      <form onSubmit={save}>
        <div className={styles.grid}>
          <label><span>Acquired on</span><input type="date" value={acquiredOn} onChange={(event) => { setAcquiredOn(event.target.value); setMessage(""); }} /></label>
          <label><span>Colony status</span><select value={colonyStatus} onChange={(event) => { setColonyStatus(event.target.value as ColonyStatus); setMessage(""); }}>
            {colonyStatuses.map(status => <option value={status} key={status}>{colonyStatusLabels[status]}</option>)}
          </select></label>
          <label className={styles.notes}><span>Private observations</span><textarea rows={4} maxLength={5000} value={privateNotes} onChange={(event) => { setPrivateNotes(event.target.value); setMessage(""); }} placeholder="Breeding, feeding, enclosure conditions, changes you've noticed…" /><small>{privateNotes.length} / 5000</small></label>
        </div>
        <div className={styles.footer}><span className={isError ? styles.error : styles.feedback} role={isError ? "alert" : "status"} aria-live="polite">{message || "Changes are saved to your private collection record."}</span><button type="submit" disabled={pending}>{pending ? "Saving…" : "Save colony record"}</button></div>
      </form>
      <div className={styles.remove}><span>Collection management</span><CollectionButton speciesId={entry.speciesId} speciesName={speciesName} initialCollected signedIn detail /></div>
    </details>
  </section>;
}
