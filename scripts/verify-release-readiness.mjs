import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {join} from "node:path";
const root=new URL("..",import.meta.url).pathname;
const read=(p)=>readFileSync(join(root,p),"utf8");
function walk(path="app"){
 return readdirSync(join(root,path),{withFileTypes:true}).flatMap(item=>{
  const target=path+"/"+item.name;
  return item.isDirectory()?walk(target):[target];
 });
}
const pages=walk().filter(path=>/\/page\.tsx$/.test(path));
assert.ok(pages.length>=55,"Expected all major PodScape routes in release audit");
const manifest=read("app/manifest.ts");
for(const token of ['start_url: "/app"','display: "standalone"','scope: "/"']){
 assert.ok(manifest.includes(token),"PWA manifest regression: "+token);
}
const layout=read("app/layout.tsx");
assert.ok(layout.includes("viewport"),"Mobile app must export viewport metadata");
assert.ok(layout.includes("appleWebApp"),"iOS standalone preferences should remain configured");
const mobile=read("components/KeeperMobileNav.module.css");
assert.ok(mobile.includes("safe-area-inset-bottom"),"Navigation must reserve iPhone safe area");
assert.ok(mobile.includes("max-width:350px"),"Navigation must support narrower phones");
assert.ok(mobile.includes("prefers-reduced-motion"),"Mobile navigation should honor reduced motion");
const workspace=read("components/PodscapeHome.module.css");
assert.ok(workspace.includes("100dvh"),"Widget editor should respect dynamic viewport");
assert.ok(workspace.includes("env(safe-area-inset-bottom"),"Widget editor should respect phone safe area");
const homeShortcuts=read("components/CustomizableHomeShortcuts.tsx");
const manager=read("components/ManagerWorkspace.tsx");
for(const [code,title,resetKey] of [[homeShortcuts,"Home","home-shortcuts"],[manager,"Manager","manager-shortcuts"]]){
 const confirmations=code.split('confirmWorkspaceReset("'+resetKey+'")').length-1;
 assert.ok(confirmations>=2,title+" must confirm resets in both standard and inline mobile editors");
}
const sync=read("components/PreferenceSyncBridge.tsx");
assert.ok([...sync.matchAll(/readLocalUiPreferences\(([^)]*)\)/g)].every(match=>match[1].includes("userId")),"All sync reads must include signed-in member scope");
const bulk=read("components/KeeperBulkQrCreator.tsx");
const bulkCss=read("components/KeeperBulkQrCreator.module.css");
assert.ok(bulk.includes("window.print()"),"Bulk print must use browser print dialog");
assert.ok(bulkCss.includes("@media print")&&bulkCss.includes("break-inside:avoid"),"Printed QR labels must not split across pages");
assert.ok(bulkCss.includes("-webkit-overflow-scrolling:touch"),"Phone preview should support touch scrolling");
assert.ok(read("components/KeeperQrCreator.module.css").includes("font-size:16px"),"iPhone QR form fields must not trigger Safari focus zoom");
const owner=read("app/account/owner-tools/analytics/page.tsx");
assert.ok(owner.includes("isAdminAuthenticated()"),"Owner analytics must remain owner-protected");
console.log("Release source audit passed: "+pages.length+" routes, PWA shell, mobile edit gestures, QR printing, sync scope and owner protection.");
