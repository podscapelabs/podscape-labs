export function VendorSocialIcon({name}:{name:"instagram"|"facebook"|"website"}){
 const base={width:18,height:18,viewBox:"0 0 24 24","aria-hidden":true as const,focusable:false as const};
 if(name==="instagram")return <svg {...base} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="2.5" width="19" height="19" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.6" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>;
 if(name==="facebook")return <svg {...base} fill="currentColor"><path d="M14.6 21v-8h2.7l.4-3.2h-3.1V7.7c0-.9.3-1.6 1.6-1.6h1.7V3.2a22 22 0 0 0-2.5-.2c-2.5 0-4.2 1.5-4.2 4.3v2.4H8.4V13h2.8v8h3.4Z"/></svg>;
 return <svg {...base} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-3 3-4.5 6-4.5 9s1.5 6 4.5 9c3-3 4.5-6 4.5-9S15 6 12 3Z"/></svg>;
}
