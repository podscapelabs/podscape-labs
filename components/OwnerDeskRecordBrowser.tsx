import Link from "next/link";
import type {ReactNode} from "react";
import {PodscapeLineIcon} from "./PodscapeLineIcon";
import styles from "./OwnerDeskRecordBrowser.module.css";

export type OwnerDeskFilterOption={value:string;label:string};
export type OwnerDeskSelectFilter={
 name:string;label:string;value:string;options:readonly OwnerDeskFilterOption[]
};
export function OwnerDeskRecordFilters({
 action,searchLabel,searchPlaceholder,searchValue="",filters=[],hiddenFields=[],clearHref,children
}:{
 action:string;searchLabel:string;searchPlaceholder:string;searchValue?:string;
 filters?:readonly OwnerDeskSelectFilter[];hiddenFields?:readonly {name:string;value:string}[];
 clearHref:string;children?:ReactNode
}){
 return <div className={styles.browser}>
  <form method="get" action={action} role="search" aria-label={searchLabel+" and filters"} className={styles.form}>
   <label className={styles.search}><PodscapeLineIcon name="search"/><span className={styles.srOnly}>{searchLabel}</span><input type="search" name="q" defaultValue={searchValue} placeholder={searchPlaceholder} autoComplete="off"/></label>
   {hiddenFields.map(field=><input type="hidden" name={field.name} value={field.value} key={field.name}/>)}
   {filters.map(filter=><label className={styles.filter} key={filter.name}><span>{filter.label}</span><select name={filter.name} defaultValue={filter.value}>{filter.options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></label>)}
   <button className={styles.submit} type="submit"><PodscapeLineIcon name="filter"/> Apply</button>
   <Link className={styles.clear} href={clearHref}>Clear</Link>
  </form>
  {children?<div className={styles.extra}>{children}</div>:null}
 </div>;
}
export function OwnerDeskRecordCount({shown,total,noun="records",detail}:{
 shown:number;total?:number;noun?:string;detail?:string
}){
 return <p className={styles.count} role="status">Showing {shown}{typeof total==="number"?" of "+total:""} {noun}{detail?" · "+detail:""}</p>;
}
