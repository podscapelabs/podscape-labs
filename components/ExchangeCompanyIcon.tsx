import type {SVGProps} from "react";

/** Independent Pod Exchange identity marks. These are company logos, not UI navigation icons. */
export type ExchangeSymbol="DUCK"|"MOO"|"PANDA"|"BLUE"|"TITAN"|"CLOWN";
const companyLabels:Record<ExchangeSymbol,string>={
 DUCK:"Rubber Ducky Inc. luxury moss housing",MOO:"Dairy Cow Dairy cow",
 PANDA:"Panda King Holdings bark estate",BLUE:"Powder Blue Express leaf delivery",
 TITAN:"Titan Heavy Industries cork mining",CLOWN:"Clown Entertainment comedy mask"
};
export function ExchangeCompanyIcon({symbol,size=25,...props}:{symbol:string;size?:number}&Omit<SVGProps<SVGSVGElement>,"children">){
 const key=(symbol in companyLabels?symbol:"DUCK") as ExchangeSymbol;
 return <svg {...props} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label={companyLabels[key]}>
 {key==="MOO"&&<><path d="M5 9 2.5 6.5l.5-2.5L7 6l2 1M19 9l2.5-2.5L21 4l-4 2-2 1"/><path d="M5 9c-.6 3.3.2 8.9 7 10 6.8-1.1 7.6-6.7 7-10-1.2-2.6-4-4-7-4S6.2 6.4 5 9Z"/><path d="M8.5 12h.01M15.5 12h.01"/><rect x="8" y="14.5" width="8" height="4.5" rx="2.2"/><path d="M10.5 16.5h.01M13.5 16.5h.01"/></>}
 {key==="BLUE"&&<><path d="M19.5 3.5C11 4 6 7.5 5 14c-.3 3.2 2.1 5.7 5.5 5.2 6.5-.7 9.4-7.4 9-15.7Z"/><path d="M4 21c3.8-5.8 7.2-8.7 12.5-12.3M3 11H1M4 15H2"/></>}
 {key==="PANDA"&&<><path d="M5 7c4-2 9-1 14-3v13c-5 .5-9.5 2-14 3V7Z"/><path d="m5 10 14-3M5 14l14-3M5 18l14-3"/><path d="m8 7 1 12M14 5.5l1 12"/></>}
 {key==="TITAN"&&<><path d="M4 20 15.5 8.5M13 6l3 3M12 5c3.5-2.1 7.4-1.5 10 2.3-4.3-.5-7.4.8-9.7 3.7L12 5Z"/><path d="m3 17 4 4"/></>}
 {key==="CLOWN"&&<><path d="M4 5.5c5.4-2.9 10.6-2.9 16 0v7.6c0 4.4-3.2 7.2-8 8-4.8-.8-8-3.6-8-8V5.5Z"/><path d="M7.3 10.5 9.7 12l1.1-2.5M16.7 10.5 14.3 12l-1.1-2.5"/><path d="M8.5 15.6c2.2 2.1 4.8 2.1 7 0"/></>}
 {key==="DUCK"&&<><path d="M3.5 20V10l8.5-6 8.5 6v10H3.5Z"/><path d="M8 20v-6h8v6M3 10l9-6 9 6"/><path d="M10 10c0-2 1.2-3.2 3-3.4M12 10c1-1.4 2.5-1.8 4.2-1.7"/></>}
 </svg>;
}
