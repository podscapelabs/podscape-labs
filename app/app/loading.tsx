import {PodscapeLineIcon} from "@/components/PodscapeLineIcon";
import styles from "./loading.module.css";

/**
 * Lightweight route loading state; disappears as soon as the actual page is ready.
 * No artificial progress percentage, delay, or client-side timer.
 */
export default function Loading(){
 return <main className={styles.page} aria-busy="true" aria-label="Opening PodScape">
  <div className={styles.ambient} aria-hidden="true"/>
  <div className={styles.content} role="status" aria-live="polite">
   <span className={styles.appMark} aria-hidden="true"><PodscapeLineIcon name="leaf"/></span>
   <div className={styles.brand}>
    <h1>PodScape</h1>
    <span>LABS</span>
   </div>
   <p>Your little world of discovery.</p>
   <div className={styles.progress} aria-hidden="true"><span/></div>
   <small>Preparing your space…</small>
  </div>
 </main>;
}
