import Link from "next/link";
import type {ReactNode} from "react";
import {PodscapeLineIcon,type PodscapeIconName} from "./PodscapeLineIcon";
import styles from "./OwnerDeskFoundation.module.css";

export type OwnerDeskAction={href:string;label:string;icon?:PodscapeIconName;external?:boolean};

/** One owner interface contract: same structure, focus states and actions in every desk.
 * Desk-specific editors and data lifecycles stay in their current owners.
 */
export function OwnerDeskHeader({area,title,description,icon,actions=[],aside,backHref="/account/owner-tools"}:{
 area:string;title:string;description:string;icon?:PodscapeIconName;
 actions?:OwnerDeskAction[];aside?:ReactNode;backHref?:string;
}){
 return <header className={styles.hero} aria-label={title}>
  <div className={styles.identity}>
   <p className={styles.eyebrow}>OWNER STUDIO / {area.toUpperCase()}</p>
   <h1>{title}</h1>
   <p className={styles.description}>{description}</p>
   <nav className={styles.actions} aria-label={title+" actions"}>
    <Link className={styles.back} href={backHref}><PodscapeLineIcon name="arrow-left"/> Owner Studio</Link>
    {actions.map(action=><Link className={styles.action} key={action.href} href={action.href} target={action.external?"_blank":undefined} rel={action.external?"noopener noreferrer":undefined}>{action.icon?<PodscapeLineIcon name={action.icon}/>:null}{action.label}<PodscapeLineIcon name="arrow-right"/></Link>)}
   </nav>
   {aside?<div className={styles.aside}>{aside}</div>:null}
  </div>
  {icon?<span className={styles.icon} aria-hidden="true"><PodscapeLineIcon name={icon}/></span>:null}
 </header>;
}

/** Shared section surface and introduction for all Owner Studio forms and tables. */
export function OwnerDeskSection({title,description,children,id,actions}:{
 title:string;description?:string;children:ReactNode;id?:string;actions?:ReactNode
}){
 return <section className={styles.section} aria-label={title} id={id}>
  <header className={styles.sectionHeader}><div><h2>{title}</h2>{description?<p>{description}</p>:null}</div>{actions?<div className={styles.sectionActions}>{actions}</div>:null}</header>
  {children}
 </section>;
}
