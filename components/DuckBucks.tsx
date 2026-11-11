/** A rubber duck silhouette drawn entirely with strokes.
 * Reused as the Duck Bucks currency glyph in every market interface.
 * The icon inherits currentColor, so all five PodScape themes work.
 */
export function DuckBuckIcon({size=18,className}:{size?:number;className?:string}){
 return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
  <path d="M11 15.5c-1.1-1.4-1.7-3.2-1.7-5.1 0-4.4 3.4-7.7 7.6-7.7 4.1 0 7.4 3.2 7.5 7.3v1.5l4.2 1.7-4.2 2.5c-.3 5.3-5.6 9.3-11.8 9.3-6.4 0-11.3-3.4-11.3-8.2 0-3.9 2.8-6.8 6.7-7.2" transform="translate(5 -2) scale(.83)"/>
  <circle cx="18.4" cy="9.6" r="1" fill="currentColor" stroke="none"/>
  <path d="M6.5 21.5c3.6 2.9 10.5 3.6 15 .4" opacity=".6"/>
 </svg>;
}
export function duckBucksNumber(amount:number):string{
 return amount.toLocaleString("en-CA",{minimumFractionDigits:2,maximumFractionDigits:2});
}
export function DuckBucks({amount,className,showSign=false}:{amount:number;className?:string;showSign?:boolean}){
 return <span className={className} style={{display:"inline-flex",alignItems:"center",gap:"0.28em",whiteSpace:"nowrap",fontVariantNumeric:"tabular-nums"}} aria-label={`${showSign&&amount>0?"plus ":amount<0?"minus ":""}${duckBucksNumber(Math.abs(amount))} Duck Bucks`}>
  {showSign&&amount!==0?<span aria-hidden="true">{amount>0?"+":"−"}</span>:null}
  <DuckBuckIcon size={18}/>
  <span aria-hidden="true">{duckBucksNumber(Math.abs(amount))}</span>
 </span>;
}
