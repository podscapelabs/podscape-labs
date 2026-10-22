"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { PodscapeLineIcon, type PodscapeIconName } from "./PodscapeLineIcon";
import styles from "./KeeperMobileNav.module.css";
const items: {href:string;icon:PodscapeIconName;label:string;primary?:boolean}[] = [
 {href:"/app",icon:"leaf",label:"Explore"},
 {href:"/ledger",icon:"book",label:"Ledger"},
 {href:"/keeper/scan",icon:"scan",label:"Scan",primary:true},
 {href:"/keeper",icon:"manager",label:"Manager"},
 {href:"/menu",icon:"menu",label:"Menu"}
];
export function GlobalMobileNav(){
 const pathname=usePathname();
 const excluded=pathname==="/"||pathname==="/admin"||pathname.startsWith("/admin/")&&pathname!=="/admin/preview"||pathname.startsWith("/account/login")||pathname.startsWith("/account/register")||pathname.startsWith("/account/reset")||pathname.startsWith("/auth/");
 if(excluded)return null;
 const active=pathname.startsWith("/ledger")?"Ledger":pathname.startsWith("/keeper/scan")?"Scan":pathname.startsWith("/keeper")?"Manager":pathname==="/menu"||pathname.startsWith("/fun-zone")||pathname.startsWith("/shop")||pathname.startsWith("/field-guide")||pathname.startsWith("/explore")?"Menu":"Explore";
 return <nav className={styles.nav} aria-label="PodScape mobile navigation">{items.map(item=><Link href={item.href} key={item.label} aria-current={active===item.label?"page":undefined} className={`${styles.item} ${item.primary?styles.primary:""} ${active===item.label?styles.active:""}`}><span><PodscapeLineIcon name={item.icon}/></span><small>{item.label}</small></Link>)}</nav>;
}
