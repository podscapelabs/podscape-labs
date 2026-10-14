"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setSpeciesCollected } from "@/app/ledger/collection/actions";
import styles from "./CollectionControls.module.css";

function OwnershipLeaf({ filled }: { filled: boolean }) {
  return <svg className={styles.ownershipLeaf} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.3 3.7C11.6 3.2 5.7 5.7 4 11.2c-1.1 3.5.5 7.3 4.7 8 7.6 1.3 12.2-5.9 11.6-15.5Z" />
    <path d="M5.7 18.2c2.9-3.7 6.5-6.4 10.7-8.4" fill="none" />
  </svg>;
}

export function CollectionButton({ speciesId, speciesName, initialCollected, signedIn, detail = false, compact = false }: {
  speciesId: string;
  speciesName: string;
  initialCollected: boolean;
  signedIn: boolean;
  detail?: boolean;
  compact?: boolean;
}) {
  const [collected, setCollected] = useState(initialCollected);
  const [animation, setAnimation] = useState<"sprout" | "wither" | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => { setCollected(initialCollected); }, [initialCollected]);
  useEffect(() => {
    if (!animation) return;
    const timer = window.setTimeout(() => setAnimation(null), 710);
    return () => window.clearTimeout(timer);
  }, [animation]);

  const title = collected ? `Remove ${speciesName} from My Collection` : `Add ${speciesName} to My Collection`;

  if (!signedIn) {
    return compact
      ? <div className={styles.ownershipControl}><Link className={styles.ownershipToggle} href="/account/login" aria-label={`Sign in to save ${speciesName}`} title={`Sign in to save ${speciesName}`}><OwnershipLeaf filled={false} /></Link></div>
      : <Link className={`${styles.action} ${detail ? styles.detail : ""}`} href="/account/login">Sign in to collect →</Link>;
  }

  const toggle = () => {
    if (pending) return;
    // Removing a saved species also removes its keeper details, so guard the smaller control against accidental taps.
    if (collected && !window.confirm(`Remove ${speciesName} from My Collection? Your saved keeper details for this species will also be deleted.`)) return;
    setError("");
    startTransition(async () => {
      try {
        const result = await setSpeciesCollected(speciesId, !collected);
        if (result.success) {
          if (compact) setAnimation(result.collected ? "sprout" : "wither");
          setCollected(result.collected);
          router.refresh();
        } else {
          setError(result.error || "Could not update your collection.");
        }
      } catch {
        setError("Could not update your collection. Please try again.");
      }
    });
  };

  if (compact) {
    return <div className={styles.ownershipControl}>
      <button type="button" className={styles.ownershipToggle} data-collected={collected} data-animation={animation || undefined} disabled={pending}
        onClick={toggle} aria-pressed={collected} aria-label={title} title={title}>
        <OwnershipLeaf filled={collected} />
      </button>
      {error ? <p className={styles.toggleError} role="alert">{error}</p> : null}
      <span className={styles.srOnly} role="status" aria-live="polite">{pending ? "Updating collection" : error ? error : collected ? "Saved to My Collection" : "Not in My Collection"}</span>
    </div>;
  }

  return <div className={`${styles.control} ${detail ? styles.detail : ""}`}>
    <button type="button" className={styles.action} data-collected={collected} disabled={pending}
      onClick={toggle} aria-pressed={collected} aria-label={title}>
      <span>{pending ? "Updating…" : collected && detail ? "Remove from collection" : collected ? "✓ In Collection" : "+ Add to Collection"}</span>
      <span aria-hidden="true">{collected ? "−" : "→"}</span>
    </button>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
  </div>;
}
