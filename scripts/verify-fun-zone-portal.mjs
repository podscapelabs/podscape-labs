import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const read=(path)=>readFileSync(resolve(path),"utf8");
const registry=read("lib/fun-zone-arcade.ts");
const portal=read("app/fun-zone/FunZonePortal.tsx");
const page=read("app/fun-zone/page.tsx");
const styles=read("app/fun-zone/fun-zone-portal.module.css");
const game=read("app/fun-zone/pod-exchange/page.tsx");
const gameUi=read("app/fun-zone/pod-exchange/PodExchange.tsx");
const watchlist=read("app/fun-zone/PodExchangeWatchlist.tsx");
for(const category of ["Word Games","Puzzles & Logic","Trivia & Knowledge","Simulations","PodBound"]){
 assert.ok(registry.includes('"'+category+'"'),"Missing category: "+category);
}
assert.match(registry,/\.\.\.puzzles\.map\(game=>/,"Existing puzzle routes must be discovered from canonical catalogue");
assert.match(registry,/key:"pod-exchange"/,"The Duck Bucks beta should appear automatically");
assert.match(registry,/GAME_FAVOURITES_KEY/,"Favourite games need persistent storage");
assert.match(portal,/WorkspaceEditBlock,WorkspaceEditToolbar,useWorkspaceDrag/,"Portal must reuse existing edit gestures");
assert.match(portal,/useWorkspaceEditorDialog/,"Widget library must reuse focus-trap and Escape behaviour");
assert.match(portal,/ARCADE_LAYOUT_KEY/,"Portal layout must persist separately");
assert.match(portal,/userId\|\|"guest"/,"Guest and user storage keys must be isolated");
assert.match(portal,/normaliseFavourites/,"Favourites must tolerate removed or stale game keys");
assert.match(portal,/data-workspace-root="fun-zone"/,"Drag-and-drop scope must be isolated");
for(const widget of ["featured","categories","favourites","progress","exchange"]){
 assert.ok(portal.includes('"'+widget+'"'),"Missing widget "+widget);
}
assert.match(portal,/id\.startsWith\("game:"\)/,"Individual game pin widgets should be supported");
assert.match(portal,/confirmWorkspaceReset\("fun-zone"\)/,"Reset must use PodScape's shared confirmation contract");
const editingStandards=read("components/workspace-edit-standards.ts");
const homeStyles=read("components/PodscapeHome.module.css");
const homeWidgets=read("components/HomeWidgets.tsx");
assert.match(editingStandards,/"fun-zone":"Reset Fun Zone/,"Shared reset message must cover Fun Zone");
for(const sharedClass of ["addWidgetFooter","addWidgetButton","homeEditorOverlay","widgetEditor","widgetLibrary","widgetGalleryCard","widgetLibraryFooter"]){
 assert.ok(portal.includes("homeEditStyles."+sharedClass),"Fun Zone must use Home's "+sharedClass+" class");
 assert.ok(homeStyles.includes("."+sharedClass),"Home's "+sharedClass+" style must exist");
}
assert.match(homeWidgets,/WorkspaceEditBlock/,"Home should keep using the shared workspace editor");
assert.match(portal,/onLongPress=\{\(\)=>enterCanvas\(id\)\}/,"Fun Zone should keep Home-style long-press editing");
assert.doesNotMatch(portal,/Add Widgets & Games/,"Do not restore the separate Fun Zone add-widget CTA");
assert.doesNotMatch(portal,/className=\{styles\.editButton\}/,"Avoid redundant Customize buttons");

assert.match(page,/FunZonePortal/,"Fun Zone landing must render portal");
assert.match(page,/member_puzzle_completions/,"Existing completion data must be preserved");
assert.match(page,/member_progress/,"Existing EXP and coins must remain available");
assert.match(styles,/var\(--portal-hero-start\)/,"Use theme environment hero tokens");
assert.match(styles,/var\(--surface\)/,"Use semantic surfaces");
assert.match(game,/PodExchange/,"Exchange route must remain available");
assert.match(gameUi,/Duck Bucks/,"Exchange must use Duck Bucks");
assert.match(portal,/PodExchangeWatchlist/,"Portal must render the actual watchlist widget");
assert.ok(watchlist.includes("totalValue(portfolio,cycle)"),"Watchlist must show saved portfolio value");
assert.ok(watchlist.includes('priceAt("DUCK",cycle)'),"Watchlist must show DUCK ticker");
assert.match(watchlist,/STORAGE_KEY/,"Watchlist must share exchange wallet storage");
console.log("Fun Zone portal source checks passed: categories, editable widgets, saved favourites, theme roles, existing progress, and Duck Bucks route.");
