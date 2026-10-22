export type PodscapeIconName = "leaf"|"jar"|"shop"|"book"|"community"|"vendor"|"creative"|"podbound"|"home"|"scan"|"manager"|"menu"|"qr"|"bin"|"droplet"|"calendar"|"note";

export function PodscapeLineIcon({name}:{name:PodscapeIconName}){
 const common={viewBox:"0 0 32 32",fill:"none",stroke:"currentColor",strokeWidth:1.65,strokeLinecap:"round" as const,strokeLinejoin:"round" as const,"aria-hidden":true};
 if(name==="leaf"||name==="home")return <svg {...common}><path d="M26 5C15 6 7 12 7 21c0 3 2 5 5 5 9 0 14-10 14-21Z"/><path d="M6 28c4-7 9-12 17-18M12 22c1-3 1-6 1-9M16 18c3 0 5 1 7 2"/></svg>;
 if(name==="jar"||name==="manager")return <svg {...common}><path d="M10 4h12v4H10zM9 9h14l1 17H8L9 9Z"/><path d="M12 18c3-4 6-5 9-4-1 5-4 7-9 7M16 15v7"/></svg>;
 if(name==="shop")return <svg {...common}><path d="M7 12h18l-2 15H9L7 12Z"/><path d="M12 14V9a4 4 0 0 1 8 0v5"/></svg>;
 if(name==="book")return <svg {...common}><path d="M4 7c5-1 9 0 12 3v17c-3-3-7-4-12-3V7ZM28 7c-5-1-9 0-12 3v17c3-3 7-4 12-3V7Z"/><path d="M8 12h5M8 16h5M19 12h5M19 16h5"/></svg>;
 if(name==="community")return <svg {...common}><circle cx="16" cy="10" r="4"/><circle cx="7.5" cy="13" r="3"/><circle cx="24.5" cy="13" r="3"/><path d="M9 27v-3c0-4 3-7 7-7s7 3 7 7v3M2.5 27v-3c0-3 2-5 5-5M29.5 27v-3c0-3-2-5-5-5"/></svg>;
 if(name==="vendor")return <svg {...common}><path d="M5 12h22l-2-7H7l-2 7ZM7 13v14h18V13M12 27v-8h8v8"/><path d="M5 12c1 4 5 4 7 0 1 4 7 4 8 0 2 4 6 4 7 0"/></svg>;
 if(name==="creative")return <svg {...common}><path d="M18 5c7 0 10 5 8 10-2 4-6 2-8 4-2 2 1 5-3 7C9 29 4 23 5 16 6 10 11 5 18 5Z"/><circle cx="12" cy="12" r="1.2"/><circle cx="17" cy="9" r="1.2"/><circle cx="22" cy="12" r="1.2"/><path d="M9 19c3-1 5 0 6 3"/></svg>;
 if(name==="podbound")return <svg {...common}><path d="m6 9 13-4 5 18-13 4L6 9Z"/><path d="m11 8 2-3 13 7-5 10M12 13l7-2M13 17l7-2"/></svg>;
 if(name==="scan")return <svg {...common}><path d="M5 12V6h6M21 6h6v6M27 20v6h-6M11 26H5v-6"/><path d="M11 11h4v4h-4zM18 11h3v3h-3zM11 18h3v3h-3zM18 18h4v4h-4z"/></svg>;
 if(name==="qr")return <svg {...common}><path d="M5 5h8v8H5zM19 5h8v8h-8zM5 19h8v8H5z"/><path d="M8 8h2v2H8zM22 8h2v2h-2zM8 22h2v2H8zM18 18h4v4h-4zM24 18h3v3M24 24h3v3M18 25h3v2"/></svg>;
 if(name==="bin")return <svg {...common}><path d="M8 9h16l-1 18H9L8 9ZM7 5h18v4H7z"/><path d="M12 14v8M16 14v8M20 14v8"/></svg>;
 if(name==="droplet")return <svg {...common}><path d="M16 4C12 10 8 15 8 20a8 8 0 0 0 16 0c0-5-4-10-8-16Z"/><path d="M12 22c1 2 3 3 5 3"/></svg>;
 if(name==="calendar")return <svg {...common}><path d="M6 8h20v19H6zM6 13h20M11 5v6M21 5v6"/><path d="M11 18h3M18 18h3M11 22h3M18 22h3"/></svg>;
 if(name==="note")return <svg {...common}><path d="M7 4h18v24H7zM11 10h10M11 15h10M11 20h7"/></svg>;
 if(name==="menu")return <svg {...common}><path d="M7 9h18M7 16h18M7 23h18"/></svg>;
 return null;
}
