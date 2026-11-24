"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setSpeciesWished } from "@/app/ledger/collection/wishlist-actions";
import { setSpeciesCollected } from "@/app/ledger/collection/actions";
import {PodscapeConfirmDialog} from "./PodscapeConfirmDialog";
import styles from "./CollectionControls.module.css";
import {announceAchievement} from "./AchievementToast";

function OwnershipBookmark({ filled }: { filled: boolean }) {
  return <svg className={styles.ownershipLeaf} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {filled ? <path d="m5 12 4 4L19 6" /> : <path d="M12 5v14M5 12h14" />}
  </svg>;
}

function StatusIcon({status}:{status:"neutral"|"wishlist"|"collected"}){
 return <svg width="21" height="21" viewBox="0 0 24 24" fill={status==="wishlist"?"currentColor":"none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{status==="collected"?<path d="m5 12 4 4L19 6"/>:status==="wishlist"?<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/>:<path d="M12 5v14M5 12h14"/>}</svg>;
}
export function CollectionButton({ speciesId, speciesName, initialCollected, signedIn, detail = false, compact = false, initialWished = false, statusSelector = false }: {
  speciesId: string;
  speciesName: string;
  initialCollected: boolean;
  signedIn: boolean;
  detail?: boolean;
  compact?: boolean;
  initialWished?: boolean;
  statusSelector?: boolean;
}) {
  const [wished,setWished]=useState(initialWished);
  const [selectorOpen,setSelectorOpen]=useState(false);
  const [afterRemoval,setAfterRemoval]=useState(false);
  useEffect(()=>setWished(initialWished),[initialWished]);
  const [collected, setCollected] = useState(initialCollected);
  const [animation, setAnimation] = useState<"sprout" | "wither" | null>(null);
  const [feedback,setFeedback]=useState("");
  const [confirmOpen,setConfirmOpen]=useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => { setCollected(initialCollected); }, [initialCollected]);
  useEffect(() => {
    if (!animation) return;
    const timer = window.setTimeout(() => setAnimation(null), 710);
    return () => window.clearTimeout(timer);
  }, [animation]);

  const status=collected?"collected":wished?"wishlist":"neutral";
  const title = collected ? `Remove ${speciesName} from My Collection` : `Add ${speciesName} to My Collection`;

  if (!signedIn) {
    return compact
      ? <div className={styles.ownershipControl}><Link className={styles.ownershipToggle} href="/account/login" aria-label={`Sign in to save ${speciesName}`} title={`Sign in to save ${speciesName}`}><OwnershipBookmark filled={false} /></Link></div>
      : <Link className={`${styles.action} ${detail ? styles.detail : ""}`} href="/account/login">Sign in to collect →</Link>;
  }

  const applyChange = () => {
    if(pending)return;
    setConfirmOpen(false);
    setError("");
    startTransition(async () => {
      try {
        const result = await setSpeciesCollected(speciesId, !collected, collected);
        if (result.success) {
          for(const badge of result.unlocked||[])announceAchievement(badge);
          if (compact) setAnimation(result.collected ? "sprout" : "wither");
          setCollected(result.collected);
          if(result.collected)setWished(false);
          if(!result.collected&&afterRemoval){const wish=await setSpeciesWished(speciesId,true);if(wish.success)setWished(true);else setError(wish.error||"Removed from collection, but wishlist could not be saved.");}
          setAfterRemoval(false);
          setFeedback(result.collected?"Species saved. Add a bin whenever you’re ready.":"Species removed from your saved collection.");
          router.refresh();
        } else {
          setError(result.error || "Could not update your collection.");
        }
      } catch {
        setError("Could not update your collection. Please try again.");
      }
    });
  };

  const toggle = () => {
    if(pending)return;
    if(collected){setConfirmOpen(true);return;}
    applyChange();
  };
  const confirmation=confirmOpen?<PodscapeConfirmDialog title={`Remove ${speciesName} from My Collection?`} eyebrow="MY COLLECTION / REMOVE" confirmLabel="Remove species" cancelLabel="Keep species" pending={pending}
   onConfirm={applyChange} onCancel={()=>{setConfirmOpen(false);setAfterRemoval(false)}}>
    <p>This removes the saved species bookmark and its species-level notes.</p>
    <p><strong>Bins, including archived bins, must be removed separately first.</strong> PodScape blocks this action if any bin records still exist, so care history is not silently lost.</p>
   </PodscapeConfirmDialog>:null;
  const chooseStatus=(next:"neutral"|"wishlist"|"collected")=>{
    if(pending)return;
    setSelectorOpen(false);setError("");
    if(next===status)return;
    if(collected){setAfterRemoval(next==="wishlist");setConfirmOpen(true);return;}
    if(next==="collected"){applyChange();return;}
    startTransition(async()=>{try{
      const result=await setSpeciesWished(speciesId,next==="wishlist");
      if(result.success){setWished(next==="wishlist");router.refresh();}
      else setError(result.error||"Could not update wishlist.");
    }catch{setError("Could not update wishlist.");}});
  };
  if(compact&&statusSelector)return <div className={styles.ownershipControl}>
    <button type="button" className={styles.ownershipToggle} data-collected={collected} data-status={status} disabled={pending} aria-label={`Change status for ${speciesName}: ${status==="neutral"?"Not collected":status}`} aria-expanded={selectorOpen} onClick={()=>setSelectorOpen(v=>!v)}>
      <StatusIcon status={status}/>
    </button>
    {selectorOpen?<div className={styles.statusMenu} role="group" aria-label="Species status" onKeyDown={event=>{if(event.key==="Escape")setSelectorOpen(false)}}>
      {(["neutral","wishlist","collected"] as const).map(option=><button key={option} type="button" data-status={option} aria-pressed={status===option} onClick={()=>chooseStatus(option)}><StatusIcon status={option}/><span>{option==="neutral"?"Not collected":option==="wishlist"?"Wishlist":"Collected"}</span></button>)}
      <button type="button" onClick={()=>setSelectorOpen(false)}>Cancel</button>
    </div>:null}
    {confirmation}{error?<p className={styles.toggleError} role="alert">{error}</p>:null}
    <span className={styles.srOnly} role="status">{pending?"Updating status":feedback}</span>
  </div>;

  if (compact) {
    return <div className={styles.ownershipControl}>
      <button type="button" className={styles.ownershipToggle} data-collected={collected} data-animation={animation || undefined} disabled={pending}
        onClick={toggle} aria-pressed={collected} aria-label={title} title={title}>
        <OwnershipBookmark filled={collected} />
      </button>
      {confirmation}
      {feedback?<span role="status" className={styles.srOnly}>{feedback}</span>:null}
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
    {confirmation}
    {feedback?<p role="status">{feedback}</p>:null}
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
  </div>;
}
