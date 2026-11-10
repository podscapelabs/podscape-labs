import Link from "next/link";
import { PodscapeLineIcon, type PodscapeIconName } from "./PodscapeLineIcon";
import styles from "./FirstActionEmptyState.module.css";

type Action = { href:string; label:string };
export function FirstActionEmptyState({icon,title,description,primary,secondary,eyebrow="YOUR PODSCAPE",compact=false}:{icon:PodscapeIconName;title:string;description:string;primary:Action;secondary?:Action;eyebrow?:string;compact?:boolean}){
 return <div className={compact?styles.compact:styles.card} role="group" aria-label={title}>
  <div className={styles.mark} aria-hidden="true"><PodscapeLineIcon name={icon}/></div>
  <div className={styles.body}>
   <span className={styles.eyebrow}>{eyebrow}</span>
   <h3>{title}</h3>
   <p>{description}</p>
   <div className={styles.actions}>
    <Link className={styles.primary} href={primary.href}>{primary.label}<PodscapeLineIcon name="arrow-right"/></Link>
    {secondary?<Link className={styles.secondary} href={secondary.href}>{secondary.label}</Link>:null}
   </div>
  </div>
 </div>;
}
