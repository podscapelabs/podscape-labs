import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./PodscapeUI.module.css";

type Variant = "primary" | "secondary" | "quiet" | "danger";
type Density = "regular" | "compact";
const join = (...values:(string|false|undefined)[])=>values.filter(Boolean).join(" ");

export function PodscapeButton({
  children, variant="primary", density="regular", className, type="button", ...props
}:ButtonHTMLAttributes<HTMLButtonElement> & {variant?:Variant;density?:Density}){
 return <button type={type} className={join(styles.button,styles[variant],styles[density],className)} {...props}>{children}</button>;
}

export function PodscapeActionLink({href,children,variant="primary",density="regular",className}:{
  href:string;children:ReactNode;variant?:Variant;density?:Density;className?:string
}){
 return <Link href={href} className={join(styles.button,styles[variant],styles[density],className)}>{children}</Link>;
}

type HeaderProps={
 eyebrow:string;title:string;description?:string;action?:ReactNode;decoration?:ReactNode;id?:string
};
export function PodscapePageHeader({eyebrow,title,description,action,decoration,id}:HeaderProps){
 return <header className={styles.editorial} aria-labelledby={id||"podscape-page-title"}>
  <div className={styles.headerCopy}><p className={styles.eyebrow}>{eyebrow}</p><h1 id={id||"podscape-page-title"}>{title}</h1>{description?<p className={styles.description}>{description}</p>:null}</div>
  {decoration?<div className={styles.decorative} aria-hidden="true">{decoration}</div>:<span className={styles.leaf} aria-hidden="true">❧</span>}
  {action?<div className={styles.editorialAction}>{action}</div>:null}
 </header>;
}
export function PodscapeUtilityHeader({eyebrow,title,description,action,id}:HeaderProps){
 return <header className={styles.utility} aria-labelledby={id||"podscape-page-title"}>
  <div><p className={styles.eyebrow}>{eyebrow}</p><h1 id={id||"podscape-page-title"}>{title}</h1>{description?<p className={styles.description}>{description}</p>:null}</div>
  {action?<div className={styles.utilityAction}>{action}</div>:null}
 </header>;
}

type CardProps={children:ReactNode;className?:string;title?:string};
export function PodscapeNavigationCard({title,description,href,icon}:{
 title:string;description:string;href:string;icon?:ReactNode
}){
 return <Link className={styles.navigationCard} href={href}>
   {icon?<span className={styles.navIcon} aria-hidden="true">{icon}</span>:null}
   <span className={styles.navCopy}><strong>{title}</strong><small>{description}</small></span>
   <span className={styles.arrow} aria-hidden="true">→</span>
 </Link>;
}
export function PodscapeContentCard({children,className,title}:CardProps){
 return <article className={join(styles.contentCard,className)}>{title?<h2 className={styles.cardHeading}>{title}</h2>:null}{children}</article>;
}
export function PodscapeDataRow({label,value,detail,href}:{
 label:string;value?:ReactNode;detail?:string;href?:string
}){
 const contents=<><span className={styles.rowCopy}><strong>{label}</strong>{detail?<small>{detail}</small>:null}</span>{value?<span className={styles.rowValue}>{value}</span>:null}{href?<span className={styles.arrow} aria-hidden="true">→</span>:null}</>;
 return href?<Link className={styles.dataRow} href={href}>{contents}</Link>:<div className={styles.dataRow}>{contents}</div>;
}

type StatusTone="neutral"|"success"|"warning"|"danger"|"info";
export function PodscapeStatusBadge({children,tone="neutral"}:{children:ReactNode;tone?:StatusTone}){
 return <span className={join(styles.badge,styles[tone])}>{children}</span>;
}
