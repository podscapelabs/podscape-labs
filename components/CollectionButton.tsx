"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setSpeciesCollected } from "@/app/ledger/collection/actions";
import styles from "./CollectionControls.module.css";

export function CollectionButton({ speciesId, speciesName, initialCollected, signedIn, detail = false }: {
  speciesId: string;
  speciesName: string;
  initialCollected: boolean;
  signedIn: boolean;
  detail?: boolean;
}) {
  const [collected, setCollected] = useState(initialCollected);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => { setCollected(initialCollected); }, [initialCollected]);

  if (!signedIn) {
    return <Link className={`${styles.action} ${detail ? styles.detail : ""}`} href="/account/login">Sign in to collect →</Link>;
  }

  const toggle = () => {
    setError("");
    startTransition(async () => {
      try {
        const result = await setSpeciesCollected(speciesId, !collected);
        if (result.success) {
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

  return <div className={`${styles.control} ${detail ? styles.detail : ""}`}>
    <button
      type="button"
      className={styles.action}
      data-collected={collected}
      disabled={pending}
      onClick={toggle}
      aria-pressed={collected}
      aria-label={collected ? `Remove ${speciesName} from My Collection` : `Add ${speciesName} to My Collection`}
    >
      <span>{pending ? "Updating…" : collected ? "✓ In My Collection" : "+ Add to My Collection"}</span>
      <span aria-hidden="true">{collected ? "−" : "→"}</span>
    </button>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
  </div>;
}
