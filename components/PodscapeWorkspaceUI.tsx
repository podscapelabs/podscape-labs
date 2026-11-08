import Link from "next/link";
import type {ReactNode} from "react";
import styles from "./PodscapeWorkspaceUI.module.css";

/** Shared page heading for functional desks across PodScape. Keep primary content above the fold. */
export function WorkspaceHeader({section,title,description,backHref,backLabel,aside}:{
 section:string;title:string;description?:string;backHref?:string;backLabel?:string;aside?:ReactNode
}){
 return <header className={styles.heading}>
  <div className={styles.headingContent}><p className={styles.kicker}>{section}</p><h1>{title}</h1>{description?<p className={styles.description}>{description}</p>:null}</div>
  {aside||backHref?<div className={styles.headingActions}>{aside}{backHref?<Link className={styles.backLink} href={backHref}>← {backLabel||"Back"}</Link>:null}</div>:null}
 </header>;
}

/** A consistent compact heading for sections in Manager, Shop, Ledger and related desks. */
export function WorkspaceSectionHeader({title,description,action,meta}:{
 title:string;description?:string;action?:ReactNode;meta?:ReactNode
}){
 return <div className={styles.sectionHeader}><div className={styles.sectionCopy}><h2>{title}{meta?<span className={styles.sectionMeta}>{meta}</span>:null}</h2>{description?<p>{description}</p>:null}</div>{action?<div className={styles.sectionAction}>{action}</div>:null}</div>;
}

/** Standard surface and spacing for tool-oriented content, theme-aware by default. */
export function WorkspaceCard({children,className="",label}:{
 children:ReactNode;className?:string;label?:string
}){
 return <section aria-label={label} className={[styles.card,className].filter(Boolean).join(" ")}>{children}</section>;
}

/** Small adjacent navigation routes, not stacked full-width competing CTAs. */
export function WorkspaceLinks({items}:{items:{label:string;href:string}[]}){
 return <nav className={styles.links} aria-label="Workspace links">{items.map(item=><Link key={item.href} href={item.href}>{item.label} <span aria-hidden="true">→</span></Link>)}</nav>;
}
