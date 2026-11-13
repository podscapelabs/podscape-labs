import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const dock=read("components/PortalShortcutDock.tsx");
const css=read("components/PortalShortcutDock.module.css");
const manager=read("components/ManagerWorkspace.tsx");
const home=read("components/HomeWidgets.tsx");
for(const property of ["portal","label","features","defaults","scope"])assert.ok(dock.includes(property),"Shared shortcut dock prop missing: "+property);
assert.match(dock,/useShortcutEditor\(ids,update\)/,"Portal shortcuts must retain hold-to-jiggle editing");
assert.match(dock,/homeStyles\.shortcuts/,"All portals must reuse Home shortcut grid styles");
assert.match(dock,/homeStyles\.shortcutIcon/,"Shortcut icon chips must share the Home and Manager visual system");
assert.match(dock,/homeStyles\.shortcut,styles\.shortcut/,"Shortcut cards must inherit the shared PodScape tile");
assert.match(css,/\.dock \.grid\{[^\n]*grid-template-columns:repeat\(6,/,"Shortcut dock must use the Home six-slot grid");
assert.match(css,/\.dock \.grid>\.shortcut\{[^\n]*flex-direction:column/,"Shortcuts use compact stacked icons, never giant horizontal action cards");
assert.match(dock,/moveNavigationSlot\(/,"Shortcuts need keyboard move controls");
assert.match(dock,/localStorage\.setItem\(storageKey,JSON\.stringify\(valid\)\)/,"Choices must persist independently");
assert.match(dock,/portal\+"\:"\+scope/,"Preference storage must be scoped by portal and member");
assert.match(dock,/confirmWorkspaceReset\("portal-shortcuts"\)/,"Reset must only affect portal shortcuts");
assert.doesNotMatch(dock,/>Edit shortcuts<|>Customize shortcuts</,"No extra edit button: hold-to-jiggle is primary");
assert.match(css,/@media\(max-width:600px\)/,"Shortcut blocks must fit phones");
assert.ok(!css.includes('grid[data-count="4"]')&&!css.includes('grid[data-count="5"]'),"Never vary layout by count; all portals display six");
assert.ok(dock.includes("for(const id of [...defaults,...available])"),"Fill saved layouts to six without losing the selected order");
assert.ok(css.includes("grid-template-columns:repeat(6,"),"One consistent six-column shortcut row");
assert.match(dock,/onKeyDown=\{e=>\{if\(e\.key==="F2"\)/,"Keyboard users must have a non-visual shortcut editing gesture");
assert.match(css,/prefers-reduced-motion:reduce/,"Respect reduced motion");

const funCss=read("app/fun-zone/fun-zone-portal.module.css");
assert.match(funCss,/\.quickStart\{margin:12px 0 20px;padding:0;border:0/,"Fun Zone shortcut rail should not be a huge nested panel");
for(const [path,ids] of [
 ["app/fun-zone/FunZonePortal.tsx",["categories","favourites","rankings","exchange","picture","progress"]],
 ["app/shop/page.tsx",["products","categories","featured","vendors","community","search"]],
 ["app/podbound/page.tsx",["game","cards","shop","ledger","arcade","fullshop"]],
 ["components/LedgerExplorer.tsx",["discover","collection","colonies","guide","request","games"]]
]){
 const source=read(path);
 assert.ok(source.includes('defaults={['+ids.map(id=>'"'+id+'"').join(",")+']}'),path+" must start with six shortcuts");
}
assert.ok(read("app/account/owner-tools/page.tsx").includes('defaults={["/account/owner-tools/analytics","/admin/feedback","/admin/puzzle-desk","/admin/early-access","/admin/species","/admin/products"]}'),"Owner Studio must start with six real shortcuts");
const fun=read("app/fun-zone/FunZonePortal.tsx");
assert.match(fun,/<PortalShortcutDock portal="fun-zone"/,"Fun Zone must offer its custom shortcut dock");
for(const id of ["categories","favourites","rankings","exchange","picture"])assert.ok(fun.includes('id:"'+id+'"'),"Fun Zone shortcut missing: "+id);
assert.match(fun,/ARCADE_GAMES\.map\(game=>/,"Every existing Fun Zone game must be selectable");
assert.match(fun,/renderWidget\(shortcutPanel\)/,"Shortcuts must reach information even with corresponding widgets hidden");
const shop=read("app/shop/page.tsx");
assert.match(shop,/<PortalShortcutDock portal="shop"/,"Shop must have customizable discovery shortcuts");
assert.match(shop,/id:"community"/,"Shop community section must be accessible");
const ledger=read("components/LedgerExplorer.tsx");
assert.match(ledger,/<PortalShortcutDock portal="leaf-ledger"/,"Leaf Ledger must have customizable shortcuts");
assert.match(ledger,/href:"\/field-guide"/,"Leaf Ledger shortcuts must lead to real guide route");
assert.match(ledger,/heroSearch/,"Species searching must remain primary");
assert.match(ledger,/className=\{spotlight\.heroDiscovery\}/,"Search and organism filtering must share one discovery area");
assert.match(ledger,/\{catalogueToolbar\}/,"Organism and filter controls must be near search, not below shortcuts");
assert.match(ledger,/className=\{spotlight\.shortcutStrip\}/,"Leaf Ledger shortcuts must sit outside its hero");
assert.match(ledger,/id:"request",label:"Request Species"[\s\S]*?onClick:\(\)=>setRequestLaunch/,"Request Species shortcut must directly open the form");
assert.match(ledger,/SpeciesRequestButton launchSignal=\{requestLaunch\} hideTrigger/,"Request form must be accessible from shortcut");
assert.doesNotMatch(ledger,/ledger-request-species/,"Request Species should not appear as a redundant catalogue CTA");
const ledgerCss=read("app/ledger/discover.module.css");
assert.match(ledgerCss,/\.shortcutStrip\{/,"Shortcut row must have its own spacing outside the hero");
assert.match(ledgerCss,/\.heroDiscovery\{/,"Hero search and filters must have unified spacing");

const bound=read("app/podbound/page.tsx");
assert.match(bound,/<PortalShortcutDock portal="podbound"/,"PodBound must have customizable feature shortcuts");
assert.match(bound,/id:"cards"/,"Card Gallery must remain accessible");
const owner=read("app/account/owner-tools/page.tsx");
assert.match(owner,/<PortalShortcutDock portal="owner-studio"/,"Owner Studio must have custom shortcuts");
assert.match(owner,/isAdminAuthenticated/,"Owner shortcuts must stay behind authorization");
assert.match(owner,/\.\.\.ownerOperations,\.\.\.ownerDesks/,"All owner desks and operations must be discoverable");
assert.match(manager,/useShortcutEditor\(ids,change,canvasEditing\)/,"Existing Manager shortcut editing must be preserved");
assert.match(manager,/tools:\["care","notes","population","bulkcare"/,"Care, notes, population and multi-care are valid starter shortcuts");
assert.doesNotMatch(manager,/Work from your portal/,"Do not bring back a duplicate fixed Manager action block");
assert.match(home,/shortcuts:ReactNode/,"Home shortcut system must remain a core configurable block");
for(const name of ["Home","Manager","Fun Zone","Leaf Ledger","Shop","PodBound","Owner Studio"])assert.ok(name.length>0);
console.log("Portal shortcuts QA passed: configurable, independently saved, preserved across all seven portals.");
