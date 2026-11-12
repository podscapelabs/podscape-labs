"use client";
export function OwnerThemeRestoreButton(){
 return <button type="button" onClick={()=>window.dispatchEvent(new Event("podscape-owner-theme-restore"))}>Show floating theme tester</button>;
}
