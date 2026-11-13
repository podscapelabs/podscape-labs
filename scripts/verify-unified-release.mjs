import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

// Keep source-level checks intentionally conservative: next build is still the final gate.
const labels=read("components/workspace-widget-labels.ts");
for(const name of ['Recently Updated','Favorites','Your Bins','Care Schedule','Recent Care'])
 assert.ok(labels.includes(name),"Missing canonical widget name: "+name);
const home=read("components/HomeWidgets.tsx");
const manager=read("components/ManagerWorkspace.tsx");
const presets=read("components/onboarding-presets.ts");
assert.match(home,/homeWidgetNames/);
assert.match(manager,/managerWidgetNames/);
assert.match(presets,/homeWidgetNames/);
assert.match(home,/group\.category==="field_guide"/,"Field Guide lookup must use the current six-category shape");
assert.ok(!home.includes('group.label==="FIELD GUIDE"'),"Stale old group.label reference");

const taxonomy=read("data/update-categories.ts");
for(const id of ["leaf_ledger","whats_improved","new_features","field_guide","shop_vendors","fun_podbound"])
 assert.ok(taxonomy.includes('id:"'+id+'"'),"Missing update category "+id);
const feed=read("components/MarketingSite.tsx");
const cards=read("components/RecentCategoryCards.tsx");
assert.match(feed,/getPublishedUpdates\(\)/);
assert.match(feed,/vendor_profiles/);
assert.match(feed,/\.eq\("status","approved"\)/);
assert.match(feed,/isSpeciesRecordActive\(r\)/);
assert.match(feed,/grouped|48-hour|48 hours/);
assert.match(cards,/updateCategoryById/);
assert.match(cards,/aria-expanded=\{isExpanded\}/);
assert.match(cards,/hidden=\{!isExpanded\}/);

const updatesPage=read("app/admin/updates/page.tsx");
const updatesAction=read("app/admin/updates/actions.ts");
const updatesModel=read("lib/podscape-updates.ts");
const updatesSql=read("sql/podscape-updates-setup.sql");
assert.match(updatesPage,/isAdminAuthenticated\(\)/);
assert.match(updatesPage,/Save draft/);
assert.match(updatesPage,/Publish now/);
assert.match(updatesPage,/Unpublish announcement/);
assert.match(updatesPage,/name="details"/,"Updates Desk must accept detailed fix lines");
assert.match(updatesPage,/Brief description/,"Updates Desk needs a compact public preview");
assert.match(updatesAction,/details\.length>12/,"Fix list must be limited");
assert.match(updatesAction,/details\.length===0/,"Publishing requires a real fix list");
assert.match(updatesModel,/summary,details,href/,"Published records must include detail list");
const detailSql=read("sql/podscape-updates-details.sql");
assert.match(detailSql,/add column if not exists details jsonb/);
assert.match(detailSql,/grant select \(details\)/);
const dialog=read("components/RecentCategoryCards.tsx");
const dialogCss=read("components/UpdateDetailDialog.module.css");
const sharedDialog=read("components/PodscapeInfoDialog.tsx");
const sharedDialogCss=read("components/PodscapeInfoDialog.module.css");
assert.match(dialog,/PodscapeInfoDialog/,"Update details must use shared app info sheet");
assert.match(sharedDialog,/dialog\.showModal\(\)/,"Shared native dialog must manage focus");
assert.match(sharedDialog,/addEventListener\("cancel",onCancel\)/,"Escape closes the shared modal");
assert.match(sharedDialog,/onMouseDown/,"Dialog backdrop supports dismissal");
assert.match(dialog,/item\.details!==undefined/,"Automatic content preserves direct links");
assert.match(dialog,/createPortal\(/,"Update detail sheet must escape widget overflow");
assert.match(dialog,/onClose/,"Caller must restore the opener's focus");
assert.match(sharedDialogCss,/safe-area-inset-bottom/,"Shared info sheet respects iPhone safe area");
assert.match(sharedDialogCss,/prefers-reduced-motion/,"Shared info sheet respects reduced motion");
assert.match(feed,/details:Array\.isArray\(a\.details\)/,"Curated details must reach the dashboard");

assert.match(updatesAction,/isAdminAuthenticated\(\)/);
assert.match(updatesAction,/published_at/);
assert.match(updatesAction,/validDestination\(href\)/);
assert.match(updatesModel,/\.eq\("status","published"\)/);
assert.match(updatesSql,/enable row level security/i);
assert.match(updatesSql,/using \(status='published'\)/);
assert.match(updatesSql,/revoke all on public\.podscape_updates from anon,authenticated/);
assert.ok(read("data/owner-desks.ts").includes("/admin/updates"),"Updates Desk must appear in Owner Studio");

const vendorAction=read("app/shop/vendors/actions.ts");
const vendorOwner=read("app/admin/vendors/page.tsx");
const vendorPublic=read("app/shop/vendors/page.tsx");
const vendorSql=read("sql/vendor-directory-setup.sql");
assert.match(vendorAction,/requireCustomerPreviewAccess\(\)/);
assert.match(vendorAction,/email_confirmed_at/);
assert.match(vendorAction,/isAdminAuthenticated\(\)/);
assert.match(vendorAction,/status:"pending"/);
assert.match(vendorPublic,/\.eq\("status","approved"\)/);
assert.match(vendorOwner,/reviewVendorProfile/);
assert.match(vendorSql,/enable row level security/i);
assert.ok(!/[❧❦✿❀✦✧✺♧☘◇◆◉◌◈☷▥▤⟡🍃🌿🍂🌱⌕⠿]/u.test(vendorPublic+vendorOwner),"Vendor card must use semantic icons");
const browser=read("app/shop/vendors/VendorDirectoryBrowser.tsx");
const vendorApplication=read("app/shop/vendors/VendorApplication.tsx");
const globalFields=read("sql/vendor-global-shipping.sql");
const regions=read("lib/vendor-regions.ts");
const vendorActions=read("app/shop/vendors/actions.ts");
const socialIcons=read("components/VendorSocialIcon.tsx");
for(const s of ['country_code','shipping_mode','shipping_countries','shipping_notes','live_animal_shipping'])
 assert.ok(globalFields.includes(s),"Global vendor schema missing "+s);
assert.match(browser,/vendorShipsTo/,"Destination search must use shipping classifications");
assert.match(browser,/v\.country_code===origin/,"Origin search must use structured countries");
assert.match(browser,/vendorDetails/,"Long vendor biography must be collapsed by default");
assert.match(browser,/VendorSocialIcon/,"Social links must use recognizable iconography");
assert.match(socialIcons,/instagram/);assert.match(socialIcons,/facebook/);
assert.match(regions,/Intl\.DisplayNames/,"Country labels must be localized by country code");
assert.match(vendorApplication,/name="countryCode"/);
assert.match(vendorApplication,/name="shippingMode"/);
assert.match(vendorApplication,/name="shippingCountries"/);
assert.match(vendorApplication,/name="liveAnimalShipping"/);
assert.match(vendorActions,/validVendorCountry/);
assert.match(vendorOwner,/shipping_countries/,"Owner reviews must disclose shipping details");
assert.match(vendorPublic,/VendorDirectoryBrowser/,"Public listing should be compact and filterable");


const splash=read("app/app/loading.tsx");
const splashCss=read("app/app/loading.module.css");
const wordmark=read("public/assets/logos/podscape-wordmark.svg");
assert.match(splash,/<h1>PodScape<\/h1>/);
assert.match(splash,/PodscapeLineIcon name="leaf"/);
assert.match(splashCss,/place-items:center/);
assert.match(splashCss,/safe-area-inset-bottom/);
assert.match(splashCss,/prefers-reduced-motion/);
assert.ok(!/™|\bTM\b/.test(splash+wordmark),"The app loading identity must not include trademark decorations");
assert.ok(!read("app/account/owner-tools/page.tsx").includes("onboarding=preview"),"Owner preview should stay removed");
console.log("Release candidate source checks passed: six-category feed, vendor safety, draft-first owner announcements, canonical widgets and splash.");
