import assert from "node:assert/strict";
import {readFileSync,readdirSync,statSync} from "node:fs";
import {join,relative,sep} from "node:path";
const root=new URL("../",import.meta.url).pathname;
const file=path=>readFileSync(join(root,path),"utf8");
function walk(dir){
 const result=[];
 for(const name of readdirSync(join(root,dir))){
  const p=join(dir,name),meta=statSync(join(root,p));
  result.push(...(meta.isDirectory()?walk(p):[p.replaceAll(sep,"/")]));
 }
 return result;
}
const pages=walk("app").filter(p=>p.endsWith("/page.tsx"));
const allComponents=walk("components").filter(p=>p.endsWith(".tsx"));
const styleFiles=[...walk("app"),...walk("components")].filter(p=>p.endsWith(".css"));
const exceptions=[
 /^app\/account\/(?:login|sign-up|forgot-password|change-password|reset-password)\/page\.tsx$/,
 /^app\/admin\/(?:forgot-password|reset-password|preview)\/page\.tsx$/,
 /^app\/auth\/callback\/page\.tsx$/,
 /^app\/early-access\/page\.tsx$/,
 /^app\/poddex(?:\/.*)?\/page\.tsx$/,
 /^app\/from-the-lab\/page\.tsx$/,
 /^app\/ledger\/my-collection\/page\.tsx$/,
 /^app\/account\/owner-tools\/market-rankings\/page\.tsx$/,
 /^app\/page\.tsx$/
];
const shellToken=/PlatformShell|WorkspaceHeader|OwnerDeskHeader|MarketingSite|PodscapeHome|SpeciesDashboardWorkspace|ManagerWorkspace|FunZonePortal|PrivatePreviewLayout|redirect\(/;
let withShell=0,excepted=0,unclassified=[],inline=[];
for(const p of pages){
 const s=file(p);
 if(/style=\{\{/.test(s))inline.push(p);
 if(shellToken.test(s)){withShell++;continue;}
 if(exceptions.some(rule=>rule.test(p))){excepted++;continue;}
 // A segment can already inherit a provider/shell through its App Router layout.
 // Leave a review warning rather than adding another shell and duplicating navigation.
 unclassified.push(p);
}
assert.ok(pages.length>=70,"App route audit unexpectedly shrank; check missing portal routes");
const portals={
 home:"components/HomeWidgets.tsx",
 manager:"components/ManagerWorkspace.tsx",
 species:"components/SpeciesDashboardWorkspace.tsx",
 "fun-zone":"app/fun-zone/FunZonePortal.tsx"
};
for(const [name,path] of Object.entries(portals)){
 const source=file(path);
 for(const token of ["WidgetLibraryHeading","WidgetLibrarySummary","WidgetLibraryFilter","WidgetLibraryEmptyState","WorkspaceEditToolbar","WorkspaceEditBlock","useWorkspaceDrag","useWorkspaceEditorDialog","confirmWorkspaceReset"]){
  assert.ok(source.includes(token),name+" must use shared workspace "+token);
 }
 assert.ok(source.includes('data-workspace-root="'+name+'"'),"Shared workspace root missing for "+name);
}
const edit=file("components/WorkspaceEditCanvas.tsx");
const standards=file("components/workspace-edit-standards.ts");
for(const token of ["EDIT_HOLD_MS","EDIT_MOVE_CANCEL_PX","EDIT_CLICK_SUPPRESS_MS"]) {
 assert.ok(edit.includes(token),"Shared pointer-edit behavior needs "+token);
 assert.ok(standards.includes(token),"Shared edit standards must define "+token);
}
for(const p of ["components/PodscapeInfoDialog.tsx","components/RankingModal.tsx"]){
 assert.ok(file(p).includes("PodscapeInfoDialog"),"One information sheet across "+p);
}
const dialog=file("components/PodscapeInfoDialog.tsx");
for(const token of ["dialog.showModal()","dialog.addEventListener(\"cancel\"","document.body.style.overflow=previousOverflow","previousFocus.focus()"]){
 assert.ok(dialog.includes(token),"Modal contract missing "+token);
}
assert.ok(!file("components/RankingModal.tsx").includes("<dialog"),"Ranking popup must not add another bespoke dialog");
assert.ok(!file("components/RankingModal.module.css").includes(".dialog{"),"Old duplicate dialog styling must be retired");
const theme=file("components/PodscapeHome.module.css");
for(const token of [".homeEditorOverlay>.widgetLibrary",".homeCanvasBlockBar>div button","--ps-accent","--ps-focus","min-height:44px"]){
 assert.ok(theme.includes(token),"Shared widget/jiggle style should use "+token);
}
const store=file("lib/theme-registry.ts");
for(const id of ["light","dark","woodland","ember","lilac"])assert.ok(store.includes(id),"All five member themes must remain registered: "+id);
const linkShells=[
 "app/podbound/page.tsx",
 "app/podbound/cards/page.tsx",
 "app/podbound/cards/[id]/page.tsx",
 "app/menu/page.tsx"
];
for(const p of linkShells)assert.ok(file(p).includes("PlatformShell"),"Shared navigation must include "+p);
const bespokeDialog=allComponents.filter(p=>p!=="components/PodscapeInfoDialog.tsx"&&p!=="components/RankingModal.tsx"&&/<dialog|role="dialog"|role="alertdialog"/.test(file(p)));
const hardcoded=styleFiles.map(p=>({p,count:(file(p).match(/#[\da-fA-F]{6}\b/g)||[]).length})).filter(x=>x.count>0).sort((a,b)=>b.count-a.count).slice(0,12);
console.log("App-wide consistency audit passed.");
console.log(JSON.stringify({pageRoutes:pages.length,withSharedOrDelegatedShell:withShell,intentionalExceptions:excepted,needsVisualShellReview:unclassified,inlineStyleRoutes:inline,bespokeDialogComponents:bespokeDialog,highestLegacyColorStylesheets:hardcoded},null,2));
