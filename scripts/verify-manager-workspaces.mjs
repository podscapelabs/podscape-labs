import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const hub=read("app/keeper/[id]/ColonyWorkspace.tsx");
const scanner=read("components/KeeperScanner.tsx");
const overview=read("components/ManagerCareWidgets.tsx");
const handler=read("app/keeper/scan/page.tsx");
const colonyPage=read("app/keeper/[id]/page.tsx");

assert.match(hub,/\/keeper\/scan\?bin=/,"Colony hub must deep-link to Quick Care with the current bin");
assert.match(hub,/mode=care/,"Direct Quick Care must stay in care mode");
for(const route of ["details","history","qr","care-reminders"])assert.ok(hub.includes(route),"Missing categorized colony tool: "+route);
assert.match(hub,/logKeeperEvent\(/,"Private notes still use the owner-scoped care server action");
assert.match(hub,/undoKeeperEvent\(/,"Private notes must retain Undo");
assert.match(hub,/Recent care/,"Recent care widget should be available");
assert.match(hub,/ColonyDashboardLayout/,"Colony must use shared customization controls");
assert.match(scanner,/speciesBins=selected\?bins\.filter/,"Species-scoped switching must remain");
assert.match(scanner,/\(multiCare\?bins:speciesBins\)\.map/,"All-bin selection should only appear in Multi-care");
assert.match(scanner,/showBinPicker/,"Other bins must be hidden until requested");
assert.match(scanner,/showHistory/,"Care history must be compact by default");
assert.match(scanner,/logKeeperEventBatch\(/,"Batch care action must remain available");
assert.match(scanner,/undoKeeperEventBatch\(/,"Batch Undo must remain available");
assert.match(scanner,/Other species/,"Keep a deliberate way to move between species");
assert.match(handler,/initialBinId=\{requested\}/,"Scan page must respect target bin");
assert.match(handler,/careMode=\{careMode\}/,"QR/Quick Care must preserve care mode");
assert.match(colonyPage,/getEnclosure\(id\)/,"Colony route must retain member ownership lookup");
assert.match(overview,/due\.length\?/,"Manager should prioritize due care");
assert.match(overview,/Scheduling is optional/,"Care schedule must be optional");
const css=read("app/keeper/[id]/ColonyWorkspace.module.css");
assert.match(css,/\.featuredTool/,"Primary Quick Care tile must stand out");
console.log("Manager workspace regression tests passed: categorized colony tools, member-scoped care links, contextual switching, batch care, Undo and compact summaries.");

const widgets=read("components/ColonyDashboardLayout.tsx");
for(const id of ["shortcuts","care","population","environment","observations","activity"])
 assert.match(widgets,new RegExp('\\\"'+id+'\\\"'),"Missing colony dashboard widget "+id);
assert.match(widgets,/podscape-colony-dashboard-v1:/,"Saved preferences must be colony-specific");
assert.match(widgets,/scope\+"\:"\+colonyId/,"Preferences must be scoped to the signed-in member and colony");
assert.match(widgets,/localStorage\.setItem\(storageKey/,"Only layout preferences are saved locally");
assert.match(widgets,/WorkspaceEditBlock/,"Reuse the PodScape dashboard drag/edit system");
assert.match(widgets,/onLongPress/,"Support hold to customize on mobile");
assert.match(widgets,/Reset this colony dashboard/,"Reset must explicitly preserve records");
assert.match(hub,/forceVisible=\{initialPanel==="observation"/,"Deep-linked observations remain accessible even when hidden");
assert.match(colonyPage,/scope=\{user\?\.id/,"Layout storage must use authenticated member identity");
assert.match(hub,/No live humidity or temperature readings/,"Environment cards must not imply sensor data");

/* Large-scale refinement safeguards: layout isolation, archived records,
   keyboard editing and mobile care selection. */
assert.match(widgets,/hydratedKey===storageKey/,"Colony layout must not leak while switching routes");
assert.match(widgets,/data-colony-widget-library/,"Widget library dialog should have a focus scope");
assert.match(widgets,/event.key==="Escape"/,"Widget library should close on Escape");
assert.match(widgets,/event.key!=="Tab"/,"Widget library should trap keyboard focus");
assert.match(widgets,/Care first/,"Provide a care-focused preset");
assert.match(widgets,/Colony growth/,"Provide a breeder-focused preset");
assert.match(widgets,/Minimal/,"Provide a simple preset");
assert.match(hub,/colony.archived/,"Archived colonies must have a read-only experience");
assert.match(hub,/tiles.filter\(tile=>!colony.archived/,"Archived colonies must hide disabled QR and care tools");
assert.match(colonyPage,/ColonyWorkspace key=\{enclosure.id\}/,"Transient state must reset between colonies");
assert.match(scanner,/visibleChoices=showAllBins\|\|binSearch.trim\(\)\?filteredBins:filteredBins.slice\(0,8\)/,"Initial Quick Care picker must be short");
assert.match(scanner,/Show all/,"Provide explicit access to the full collection");
const scannerStyles=read("components/KeeperScanner.module.css");
assert.match(scannerStyles,/\.quickChooseList\{max-height:none;overflow:visible/,"Don't nest vertical scrollers");
const drag=read("components/WorkspaceEditCanvas.tsx");
assert.match(drag,/lastClientX/,"Widget drag needs horizontal input");
assert.match(drag,/next\.left/,"Widget reorder animation must account for columns");
assert.match(css,/\.presetPicker/,"Colony presets require distinct controls");
console.log("Manager refinement checks passed: archived safety, focus, per-colony isolation, compact picker and two-axis drag.");
