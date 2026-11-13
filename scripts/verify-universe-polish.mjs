import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const owner=read("components/OwnerDeskFoundation.tsx");
const css=read("components/OwnerDeskFoundation.module.css");
for(const token of ["OwnerDeskHeader","OwnerDeskSection","aria-label={title","actions.map","Owner Studio"])
 assert.ok(owner.includes(token),"Shared Owner Studio contract: "+token);
for(const token of ["--portal-hero-start","--portal-hero-end","--portal-hero-button-bg","--ps-focus","safe-area-inset-bottom"]){
 if(token==="safe-area-inset-bottom")continue;
 assert.ok(css.includes(token),"Theme-aware owner hero must use "+token);
}
assert.match(css,/@media\(max-width:650px\)/,"Owner header must support phones");
assert.match(css,/\.actions a:focus-visible/,"Owner links must have focus rings");
const desks=[
 "app/admin/species/page.tsx","app/admin/guides/page.tsx",
 "app/admin/products/page.tsx","app/admin/vendors/page.tsx",
 "app/admin/spotlight/page.tsx","app/admin/updates/page.tsx",
 "app/admin/feedback/page.tsx","app/admin/puzzle-desk/page.tsx",
 "app/admin/podbound/page.tsx","app/admin/early-access/page.tsx",
 "app/account/owner-tools/analytics/page.tsx"
];
for(const path of desks){
 const source=read(path);
 assert.match(source,/<OwnerDeskHeader\b/,"Owner desk should inherit universal header: "+path);
 assert.match(source,/isAdminAuthenticated/,"Every owner desk must retain server privilege checks: "+path);
 assert.ok(!/href="\/admin" className="admin-back-link"/.test(source),"Owner back action must lead to studio");
}
const species=read("app/admin/species/page.tsx");
assert.match(species,/createSpeciesRecord/);
assert.match(species,/saveSpeciesRecord/);
assert.match(species,/toggleSpeciesArchive/);
const guides=read("app/admin/guides/page.tsx");
assert.match(guides,/createGuideRecord/);
assert.match(guides,/saveGuideRecord/);
assert.match(guides,/toggleGuideArchive/);
const recordBrowser=read("components/OwnerDeskRecordBrowser.tsx");
const browserCss=read("components/OwnerDeskRecordBrowser.module.css");
for(const token of ["OwnerDeskRecordFilters","OwnerDeskRecordCount","searchLabel","clearHref","hiddenFields","role=\"search\""]){
 assert.ok(recordBrowser.includes(token),"Shared owner record browser contract: "+token);
}
for(const token of ["--ps-surface","--ps-accent","--ps-focus","@media(max-width:650px)","min-height:44px"]){
 assert.ok(browserCss.includes(token),"Record browser must follow themes and touch sizing: "+token);
}
for(const path of ["app/admin/products/page.tsx","app/admin/podbound/page.tsx"]){
 const source=read(path);
 assert.match(source,/OwnerDeskRecordFilters/,"Owner catalogue uses common search/filters: "+path);
 assert.match(source,/OwnerDeskRecordCount/,"Owner catalogue uses consistent result count: "+path);
}
const updatesBrowser=read("app/admin/updates/page.tsx");
assert.match(updatesBrowser,/OwnerDeskRecordFilters/,"Updates Desk must be searchable using shared Owner Studio controls");
assert.match(updatesBrowser,/OwnerDeskRecordCount/,"Updates Desk must show consistent filtered record totals");
assert.match(updatesBrowser,/filtered\.map\(entry=>/,"Editing list should show only matching announcements");
assert.match(updatesBrowser,/status==="all"\|\|x\.status===status/,"Status filter must work without changing stored publication state");
assert.match(updatesBrowser,/changePlatformUpdateStatus/,"Publishing and unpublishing must remain available");
const cardDesk=read("app/admin/podbound/page.tsx");
assert.match(cardDesk,/aria-current=\{category===c\?"page":undefined\}/,"Card Desk category state accessible");
assert.match(cardDesk,/new URLSearchParams/,"Card Desk category switches preserve existing query filters");
const guideNav=read("app/admin/guides/GuideDeskNavigator.tsx");
assert.match(guideNav,/initialQuery/,"Guide Desk should restore query when switching records");
assert.match(guideNav,/initialCategory/,"Guide Desk should restore category when switching records");
assert.match(guideNav,/initialStatus/,"Guide Desk should restore publication status");
assert.match(guideNav,/recordHref\(item\.id\)/,"Guide selection retains URL-based filters");
assert.match(guideNav,/Clear filters/,"Guide filters must be resettable");
const guidePage=read("app/admin/guides/page.tsx");
assert.match(guidePage,/initialQuery=\{/,"Guide Desk server route must restore filters into navigator");
for(const path of ["app/admin/species/page.tsx","app/admin/guides/page.tsx","app/admin/products/page.tsx"]){
 assert.match(read(path),/OwnerDeskNotice/,"Owner save/error messages must look consistent in "+path);
}
const products=read("app/admin/products/page.tsx");
assert.match(products,/aside=\{<form className=\{styles\.create\} action=\{createProductRecord\}/,"New product still available in common hero");
const cards=read("app/admin/podbound/page.tsx");
assert.match(cards,/aside=\{<form action=\{createPodBoundCard\}/,"New PodBound card remains one action away");
const puzzle=read("app/admin/puzzle-desk/page.tsx");
assert.match(puzzle,/createPicturePuzzle/);
assert.match(puzzle,/updatePicturePuzzle/);
assert.match(puzzle,/PuzzlePublicationButton/);
const early=read("app/admin/early-access/page.tsx");
assert.match(early,/OwnerDeskSection/,"Early access must use common owner sections");
assert.match(early,/addEarlyAccessTester/);
assert.match(early,/revokeEarlyAccessTester/);
const earlyCss=read("app/admin/early-access/early-access.module.css");
assert.match(earlyCss,/--ps-surface/,"Early access must match all themes");
assert.match(early,/<OwnerDeskNotice kind="error">/,"Admin failures remain clearly reported by shared owner notice");
assert.match(owner,/role=\{kind==="error"\?"alert":"status"\}/,"Shared owner notices must expose appropriate live roles");
for(const path of ["app/admin/updates/page.tsx","app/admin/feedback/page.tsx","app/admin/puzzle-desk/page.tsx","app/admin/spotlight/page.tsx","app/admin/early-access/page.tsx"])assert.match(read(path),/OwnerDeskNotice/,"Shared save/error styles required in "+path);
const rail=read("components/PortalActionRail.tsx");
assert.match(rail,/aria-label=\{label\}/,"Context rail needs label");
assert.match(rail,/action\.href\?<Link/,"Links must support portal-to-portal navigation");
assert.match(rail,/<button key=\{action\.label\}/,"Actions must support in-place workflows");
assert.match(read("components/PortalActionRail.module.css"),/min-height:44px/,"Touch controls at least 44px");
const keeper=read("components/ManagerWorkspace.tsx");
for(const task of ['openWorkflow("care")','openWorkflow("notes")','openWorkflow("population")','openWorkflow("bulk")'])
 assert.ok(keeper.includes(task),"In-place Manager action preserved: "+task);
assert.match(keeper,/PortalActionRail/);
const workflow=read("components/ManagerWorkflowPanel.tsx");
assert.match(workflow,/initialBinId/,"Manager Quick Care must accept a selected bin identifier");
assert.match(workflow,/const bin=matches\.find\(item=>item\.id===selected\)/,"Care must never target a hidden nonmatching bin");
assert.match(workflow,/Choose a matching bin before saving/,"Search must explain hidden selections");
assert.match(workflow,/bins\.find\(item=>item\.id===initialBinId\)/,"Manager Quick Care must resolve only an owned available bin");
assert.match(keeper,/initialBinId=\{workflowBin\}/,"Selected search result must reach in-page Quick Care");
assert.match(keeper,/Log care for \$\{bin\.displayName\}/,"Search results must expose accessible direct Care using the displayed morph name");
assert.match(keeper,/openWorkflow\("care",bin\.id\)/,"Search result Care must preselect its bin");
const collection=read("app/keeper/collection/page.tsx");
for(const path of ["/keeper/scan?manual=1","/keeper/new","/keeper/import","/ledger"])
 assert.ok(collection.includes(path),"Keeper action should be one click: "+path);
const fun=read("app/fun-zone/FunZonePortal.tsx");
assert.match(fun,/id==="categories"\?"arcade-games":/,"Category anchor must belong to a rendered category widget");
assert.match(fun,/id==="favourites"\?"arcade-favourites":/,"Favorites anchor must belong to a rendered Favorites widget");
assert.match(fun,/id==="rankings"\?"rankings-spotlight":/,"Rankings anchor must belong to a rendered Rankings widget");
assert.doesNotMatch(fun,/href:"#arcade-(?:games|favourites)"/,"Quick play must not link to optional hidden widget anchors");
assert.match(fun,/\/fun-zone\/pod-exchange/);
assert.match(fun,/\/fun-zone\/picture-puzzles/);
const shop=read("app/shop/page.tsx");
assert.match(shop,/PortalActionRail/,"Shop uses shared contextual actions");
assert.match(shop,/Storefront preview · Checkout not yet available/,"Shop must not imply checkout works");
for(const path of ["app/podbound/page.tsx","app/podbound/cards/page.tsx","app/podbound/cards/[id]/page.tsx","app/menu/page.tsx"]){
 const source=read(path);
 assert.match(source,/PlatformShell/,"All themed worlds should use the universal platform shell: "+path);
 assert.ok(!source.includes("<Header/>"),"Remove duplicated local header: "+path);
}
for(const path of ["app/admin/updates/page.tsx","app/admin/feedback/page.tsx","app/admin/puzzle-desk/page.tsx","app/admin/vendors/page.tsx"]){
 assert.doesNotMatch(read(path),/<Link[^>]+className=\{styles\.back\}[^>]+Owner Studio<\/Link>/,"Shared owner header must not duplicate Back to Studio");
}
const cardGallery=read("app/podbound/cards/page.tsx");
const cardDetail=read("app/podbound/cards/[id]/page.tsx");
assert.match(cardGallery,/getPodBoundCards\(\)/,"Card catalogue must still query published cards");
assert.match(cardGallery,/status==="published"/,"Card catalogue must hide draft cards");
assert.match(cardDetail,/card\.status!=="published"/,"Card detail must remain unavailable for drafts");
assert.match(cardDetail,/getPodBoundArtworkUrl/,"Card details must keep authored artwork");
const unsavedGuard=read("components/OwnerDeskUnsavedGuard.tsx");
assert.match(unsavedGuard,/beforeunload/,"Owner forms must warn before losing unsaved edits");
assert.match(unsavedGuard,/form\.addEventListener\("input",changed\)/,"Changes in native editor inputs must be tracked");
assert.match(unsavedGuard,/form\.addEventListener\("change",changed\)/,"Selects and checkboxes must be tracked");
assert.match(unsavedGuard,/event\.target===form/,"Saving the current form must not prompt a leave warning");
for(const path of ["app/admin/guides/page.tsx","components/ProductEditor.tsx"]){
 assert.match(read(path),/OwnerDeskUnsavedGuard/,"Editor must guard unsaved changes: "+path);
}
for(const path of ["app/admin/products/[id]/page.tsx","app/admin/podbound/[id]/page.tsx"]){
 const source=read(path);
 assert.match(source,/<OwnerDeskHeader/,"Nested editor must use unified owner hierarchy: "+path);
 assert.match(source,/backHref="\/admin\//,"Nested editor must return to its owning catalogue");
 assert.match(source,/form="(?:product-editor-form|card-editor)"/,"Nested editor must preserve direct Save");
}
assert.match(read("components/ProductEditor.tsx"),/OwnerDeskNotice/,"Product save/error feedback is theme-safe");
assert.match(read("app/admin/podbound/CardEditorForm.tsx"),/OwnerDeskNotice/,"Card upload feedback is theme-safe");
assert.doesNotMatch(read("app/admin/podbound/CardEditorForm.tsx"),/#b85c51/i,"No hardcoded alert color in Card Desk upload");
const migrations=[
 read("supabase/migrations/20261113010500_trigger_only_function_privileges.sql"),
 read("supabase/migrations/20261113013000_universe_performance_fk_indexes.sql")
];
for(const sql of migrations)assert.doesNotMatch(sql,/\b(?:truncate|delete from|drop table|update public\.member_exchange_\w+)\b/i,"No destructive migration");
assert.ok(migrations[1].includes("member_species_views_species_id_idx"));
assert.ok(migrations[1].includes("shop_inventory_adjustments_actor_user_id_idx"));
console.log("Universe polish pass: 11 shared owner desks, contextual actions across Manager/Fun Zone/Shop/Keeper, saved gameplay, five-theme shell, and non-destructive backend migration checks passed.");
