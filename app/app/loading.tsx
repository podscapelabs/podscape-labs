import Image from "next/image";
import styles from "./loading.module.css";

/**
 * Rendered immediately while the dynamic Podscape home is loading.
 * No artificial delay: the real home replaces this as soon as it is ready.
 */
export default function Loading() {
  return (
    <main className={styles.page} aria-busy="true" aria-label="Opening Podscape">
      <div className={styles.content} role="status" aria-live="polite">
        <div className={styles.symbol} aria-hidden="true">❧</div>
        <Image src="/assets/logos/podscape-wordmark.svg" width={232} height={38} alt="Podscape Labs" priority className={styles.logo}/>
        <p>A little world of discovery awaits.</p>
        <div className={styles.progress} aria-hidden="true"><span/></div>
        <small>Opening Podscape…</small>
      </div>
    </main>
  );
}
