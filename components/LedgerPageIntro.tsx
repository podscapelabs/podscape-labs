import styles from "./LedgerLayout.module.css";
import {WorkspaceHeader} from "./PodscapeWorkspaceUI";

export function LedgerPageIntro({ mode }: { mode: "discover" | "collection" }) {
  const collection = mode === "collection";

  return <header className={styles.intro}>
    <div className={`v2-container ${styles.introInner}`}>
      <div className={styles.introCopy}>
        <WorkspaceHeader section={collection ? "PODSCAPE / YOUR COLLECTION" : "PODSCAPE / SPECIES ARCHIVE"} title={collection ? "My Collection" : "Leaf Ledger"} description={collection ? "Your private species collection and colony records." : "Explore the world of isopods and discover new species."}/>
      </div>
      <svg className={styles.introLeaf} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 34C7 17 20 8 40 7c2 19-7 33-22 33-5 0-8-2-10-6Z" strokeWidth="1.5"/>
        <path d="M10 39C17 28 26 20 37 12" strokeWidth="1.5"/>
        <path d="m21 26-2-10m9 4 8 1" strokeWidth="1"/>
      </svg>
    </div>
  </header>;
}
