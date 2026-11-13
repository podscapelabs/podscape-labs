import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import ts from "typescript";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const home=read("components/PodscapeHome.module.css");
assert.match(home,/\.recentRail>\.recentCategoryCard\{flex:0 0 100%/, "Home update rail must snap whole cards on phones");
assert.match(home,/scroll-snap-type:x mandatory/, "Mobile home rails must snap consistently");

const portalActions=read("components/PortalActionRail.tsx");
const funZone=read("app/fun-zone/FunZonePortal.tsx");
assert.match(portalActions,/layout\?:"inline"\|"grid"/, "Shared portal actions should support a deliberate grid");
assert.match(funZone,/aria-label="Quick play"/, "Fun Zone needs one clear direct-play block");
assert.match(funZone,/compact layout="grid"/, "Fun Zone direct-play links should not wrap as stray pills");
assert.doesNotMatch(funZone,/label:"Game categories",icon:/, "Top shortcuts must not duplicate the game category widget");
assert.doesNotMatch(funZone,/label:"My games",icon:/, "Top shortcuts must not duplicate My Games");
assert.doesNotMatch(funZone,/label:"Rankings",icon:/, "Top shortcuts must not duplicate the rankings widget");
assert.match(funZone,/data-workspace-root="fun-zone"/, "Fun Zone customization must survive the shortcut redesign");

const profile=read("app/ledger/[slug]/page.tsx");
const catalogue=read("components/LedgerExplorer.tsx");
assert.match(profile,/role="search" action="\/ledger" method="get"/, "Species profile must make catalogue search directly accessible");
assert.match(catalogue,/URLSearchParams\(window.location.search\)\.get\("q"\)/, "Catalogue must accept explicit profile search");
assert.match(catalogue,/setGenus\("all"\);setCare\("all"\);setOrganism\("all"\)/, "Explicit search should ignore stale filters");
assert.match(read("components/SpeciesCollectionHub.module.css"),/\.actions\{display:grid;grid-template-columns:repeat\(2/, "Collection actions should be balanced");

const collection=read("app/keeper/collection/page.tsx");
const browser=read("components/ManagerColonies.tsx");
assert.match(collection,/styles\.overviewStats/, "My Colonies needs a useful information overview");
assert.match(collection,/member\.signedIn&&!unavailable/, "Database outages must not display fabricated zero counts");
assert.match(collection,/In collection/, "Summary count should not confuse collection size with bin-free bookmarks");
assert.doesNotMatch(collection,/PortalActionRail/, "My Colonies should not have an extra unstructured shortcut rail");
assert.match(collection,/styles\.moreTools/, "Secondary import/discovery actions belong in progressive disclosure");
assert.match(browser,/savedView\|\|Boolean\(initialSpecies\)\?"species":"bins"/, "Ledger species deep links must open species grouping");
assert.match(browser,/styles\.browseMode/, "Species/Bins must be a subordinate group-by control");
assert.doesNotMatch(browser,/className=\{styles\.actions\}><Link href="\/keeper\/new"/, "No duplicated Add bin/Import/Discover footer");
assert.match(browser,/binCardSummary\(bin,record\)/, "Both colony browsers must use consistent compact bin metadata");
assert.match(browser,/\{open\?<div id=\{"species-bins-"/, "Only expanded colony groups should expose management actions");
assert.doesNotMatch(browser,/owned\.length===1\?<Link href=\{"\/keeper\/"\+owned\[0\]\.id\}>Open bin/, "Never duplicate an existing bin row link");
assert.match(browser,/owned\.length>1\?<SpeciesQuickCare/, "Group-level care is only useful when multiple bins exist");

const js=ts.transpileModule(read("lib/bin-identity.ts"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const exports={};
runInNewContext(js,{exports,module:{exports}});
const {binCardSummary}=exports;
const source={commonName:"BC Maple",scientificName:"Oniscus asellus"};
assert.equal(binCardSummary({name:"BC Maple · Bin 01",label:"",quantity:0,status:"establishing"},source),"Bin 01 · Establishing");
assert.equal(binCardSummary({name:"Rack A",label:"Top shelf",quantity:14,status:"breeding"},source),"Rack A · Top shelf · 14 recorded · Breeding");
assert.match(read("components/ManagerInlineCare.tsx"),/compact\?"Care":"Quick Care"/, "Compact bin care must remain a short action without removing accessibility");

const managerWorkspace=read("components/ManagerWorkspace.tsx");
const heroSection=managerWorkspace.split("hero:<>")[1]?.split("  </>,")[0] || "";
const toolsSection=managerWorkspace.split("tools:<section")[1]?.split("</section>")[0] || "";
assert.ok(heroSection.includes("managerPrimarySearch"),"Manager hero must retain its primary search");
assert.ok(!heroSection.includes("managerWorkflowEntry"),"Required Manager hero must not contain extra workflow buttons");
assert.ok(heroSection.includes('id="manager-quick-workflow"'),"Search-initiated care must remain available when Tools widget is hidden");
assert.ok(toolsSection.includes("ManagerQuickShortcuts"),"Manager tools must retain customizable shortcuts");
assert.ok(toolsSection.includes("managerWorkflowEntry"),"Extra Manager workflows should be within the optional Tools widget");
assert.ok(!toolsSection.includes('id="manager-quick-workflow"'),"Task panel cannot be mounted solely inside a hideable widget");
const speciesGroup=browser.split('{open?<div id={"species-bins-"')[1]?.split("</article>")[0] || "";
assert.ok(speciesGroup.includes("styles.groupActions"),"Expanded groups should contain management actions");
assert.ok(speciesGroup.includes("</div>:null}"),"Management actions must disappear when species group is collapsed");
console.log("Portal cohesion QA passed: Home, Ledger, Fun Zone, Manager, deep links, outage states and bin metadata.");
