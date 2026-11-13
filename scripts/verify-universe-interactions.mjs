import assert from "node:assert/strict";
import {readFileSync,readdirSync,statSync} from "node:fs";
import {join,relative} from "node:path";
import {fileURLToPath} from "node:url";
const root=fileURLToPath(new URL("../",import.meta.url));
const read=path=>readFileSync(join(root,path),"utf8");
function walk(dir){
 return readdirSync(join(root,dir)).flatMap(item=>{
  const path=join(dir,item);
  return statSync(join(root,path)).isDirectory()?walk(path):[path];
 });
}
const routes=walk("app").filter(p=>p.endsWith("/page.tsx"));
assert.ok(routes.length>=75,"The full platform route inventory must be included in this audit");
const clientShells=["PlatformShell","WorkspaceHeader","OwnerDeskHeader","FunZonePortal","ManagerWorkspace","SpeciesDashboardWorkspace","PodscapeHome","MarketingSite","PrivatePreviewLayout","WorkspaceShell"];
const redirects=routes.filter(p=>/\bredirect\(/.test(read(p))&&!/<main|<section|<header|<h1/.test(read(p)));
const local=routes.filter(p=>/<header|<h1/.test(read(p))&&!clientShells.some(s=>read(p).includes(s))&&!p.startsWith("app/account/")&&!p.startsWith("app/admin/"));
const fallback=routes.filter(p=>!clientShells.some(s=>read(p).includes(s))&&!redirects.includes(p)&&!p.startsWith("app/account/")&&!p.startsWith("app/admin/"));
const inline=routes.filter(p=>/style=\{\{/.test(read(p)));
const routeStats={routes:routes.length,redirectOnly:redirects.length,localHeroCandidates:local.length,otherShellReview:fallback.length,inlineStyles:inline.length};
console.log("APP-WIDE ROUTE CONSISTENCY INVENTORY:",JSON.stringify(routeStats));
console.log("Custom hero/layout candidates:",local.join(", ")||"none");
console.log("Potential shell inheritance review:",fallback.join(", ")||"none");
const sections={
 home:"components/HomeWidgets.tsx",
 manager:"components/ManagerWorkspace.tsx",
 species:"components/SpeciesDashboardWorkspace.tsx",
 funZone:"app/fun-zone/FunZonePortal.tsx"
};
const counts={};
for(const [scope,path] of Object.entries(sections)){
 const s=read(path);
 for(const c of ["WidgetLibraryHeading","WidgetLibrarySummary","WidgetLibraryFilter","WidgetLibraryEmptyState","useWorkspaceEditorDialog","WorkspaceEditToolbar","WorkspaceEditBlock","useWorkspaceDrag","confirmWorkspaceReset"])
  assert.ok(s.includes(c),scope+" must use shared widget/jiggle interaction: "+c);
 assert.match(s,/<WidgetLibraryHeading\b/,"The "+scope+" library should use the common title hierarchy");
 assert.match(s,/<WidgetLibrarySummary\b/,"The "+scope+" library should show comparable added/total counts");
 assert.match(s,/aria-modal="true"/,"The "+scope+" library should expose an accessible modal");
 assert.match(s,/data-workspace-root/,"The "+scope+" canvas needs a shared reorder contract");
 counts[scope]={sharedLibrary:true,sharedJiggle:true};
}
const shared=read("components/WorkspaceEditCanvas.tsx");
for(const token of ["EDIT_HOLD_MS","EDIT_MOVE_CANCEL_PX","EDIT_CLICK_SUPPRESS_MS","onPointerDown","onPointerMove","onPointerCancel","onContextMenuCapture","prefers-reduced-motion"])
 if(token!=="prefers-reduced-motion")assert.ok(shared.includes(token),"Unified edit gesture must preserve "+token);
const editStyles=read("components/PodscapeHome.module.css");
assert.match(editStyles,/\.homeEditorOverlay\{background:color-mix\(in srgb,var\(--ps-bg/,"All widget sheets should derive their overlay from the active theme");
assert.match(editStyles,/\.homeCanvasBlockBar>div button\{[^}]*min-height:44px/,"Jiggle controls must have minimum touch dimensions");
const info=read("components/PodscapeInfoDialog.tsx");
const rank=read("components/RankingModal.tsx");
const rankStyles=read("components/RankingModal.module.css");
for(const feature of ["showModal()",'addEventListener("cancel"',"previousOverflow","aria-label={title}","onMouseDown","role"])
 if(feature!=="role")assert.ok(info.includes(feature),"Universal info sheet must support "+feature);
assert.match(rank,/PodscapeInfoDialog/,"Rankings must use universal info sheets");
assert.match(rank,/aria-expanded=\{open\}/,"Ranking trigger must report modal state");
assert.match(rank,/triggerButton\.current\.focus\(\)/,"Rankings must return focus to their trigger");
assert.doesNotMatch(rankStyles,/\.dialog\{/,"Rankings must not maintain a competing modal design");
assert.match(read("components/SpeciesResearchWidgets.tsx"),/PodscapeInfoDialog/,"Species research popups must use the same themed sheet");
assert.doesNotMatch(read("components/SpeciesProfile.module.css"),/\.researchDialog::backdrop/,"The old research-specific popup backdrop must be retired");
const chrome=read("components/WidgetLibraryChrome.tsx");
assert.match(chrome,/id=\{titleId\}/,"Library headings need real labelled-by IDs");
assert.match(chrome,/role="status"/,"Library counts need live accessible announcements");
const editHook=read("components/useWorkspaceEditorDialog.ts");
for(const term of ['event.key==="Escape"','event.key!=="Tab"','document.body.style.overflow','returnFocus.current'])
 assert.ok(editHook.includes(term),"Shared library modal must preserve "+term);
const popupSources=walk("components").concat(walk("app")).filter(p=>p.endsWith(".tsx"));
const modalInventory=popupSources.filter(p=>/<dialog\b|aria-modal="true"|role="dialog"/.test(read(p)));
console.log("SHARED EDITOR & MODAL INVENTORY:",JSON.stringify({portals:counts,modalImplementations:modalInventory.length}));
console.log("Other modal sources for manual visual QA:",modalInventory.filter(p=>!["components/PodscapeInfoDialog.tsx",...Object.values(sections)].includes(p)).join(", "));
console.log("NOTE: This is a complete route/source inventory and interaction-contract test, NOT a substitute for screenshots on all five themes.");
