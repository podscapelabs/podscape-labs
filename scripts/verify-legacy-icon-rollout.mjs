import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
import { join, resolve } from "node:path";
const root = new URL("../", import.meta.url).pathname;
function walk(directory) {
  return readdirSync(resolve(root,directory), { withFileTypes:true }).flatMap(entry => {
    const path = join(directory,entry.name);
    return entry.isDirectory() ? walk(path) : [path.split("\\").join("/")];
  });
}
const allUIFiles = [...walk("app"),...walk("components")];
const allComponents = allUIFiles.filter(p=>p.endsWith(".tsx"));
const allStyles = allUIFiles.filter(p=>p.endsWith(".css"));
assert.ok(allComponents.length>=150, "Audit unexpectedly skipped TSX screens");
assert.ok(allStyles.length>=55, "Audit unexpectedly skipped stylesheets");
const prohibited = /[❧❦✿❀✦✧✺♧☘◇◆◉◌◈☷▥▤⟡🍃🌿🍂🌱⌕⠿]/u;
for (const path of [...allComponents,...allStyles]) {
  assert.ok(!prohibited.test(read(path)), "Legacy decorative or substitute icon survived in "+path);
}


// Audit public-facing portal entry points and shared widget surfaces. This is a
// conservative allowlist, not a claim that every route has been browser-tested.
const audited = [
  "app/app/loading.tsx",
  "app/account/page.tsx",
  "app/account/owner-tools/page.tsx",
  "app/account/progress/ProgressDashboard.tsx",
  "app/community/page.tsx",
  "app/field-guide/page.tsx",
  "app/fun-zone/page.tsx",
  "app/fun-zone/FunZoneCarousel.tsx",
  "app/fun-zone/FunZoneLibrary.tsx",
  "app/keeper/page.tsx",
  "app/ledger/[slug]/page.tsx",
  "app/podbound/page.tsx",
  "app/podbound/cards/page.tsx",
  "app/podbound/cards/[id]/page.tsx",
  "app/shop/page.tsx",
  "components/ManagerWorkspace.tsx",
  "components/SpeciesDashboardWorkspace.tsx",
  "components/PuzzleLibrary.tsx",
];
const nonSemanticGlyph = /[❧✿❀✦✧❦🌿🍃🍂🌱◉♧◇◆☷▥⟡]/u;
// Continue to assert specific roles and ornamental CSS after the global source scan.
assert.ok(!/\.ornament\s*\{/.test(read("app/shop/shop-home.module.css")), "Shop hero must not use navigation icons as ornaments");
assert.ok(!/\.botanical\s*\{/.test(read("app/account/progress/progress.module.css")), "Unused botanical CSS should remain removed");
for (const path of audited) {
  const code = read(path);
  assert.ok(!nonSemanticGlyph.test(code), "Non-semantic icon or botanical glyph in " + path);
}
for (const path of [
  "app/community/page.tsx",
  "app/fun-zone/page.tsx",
  "app/ledger/[slug]/page.tsx",
  "app/podbound/cards/page.tsx",
  "app/podbound/cards/[id]/page.tsx",
  "components/ManagerWorkspace.tsx",
  "components/SpeciesDashboardWorkspace.tsx",
]) {
  assert.match(read(path), /PodscapeLineIcon/, "Expected the canonical icon component in " + path);
}
const loading=read("app/app/loading.tsx");
assert.match(loading,/podscape-wordmark\.svg/, "Keep recognizable branded loading identity");
assert.match(loading,/styles\.progress/, "Preserve the actual loading progress animation");
assert.ok(!loading.includes("styles.symbol"), "No decorative glyph in loading screen");
const funCss=read("app/fun-zone/fun-zone.module.css");
assert.match(funCss, /\.carousel::before,\.puzzleArt::before,\.puzzleArt::after\{content:none!important/, "Fun Zone ornamental layers must be disabled");
assert.match(funCss, /\.puzzleArt\{background:var\(--surface-secondary\);background-image:none!important/, "Fun Zone cards must have plain icon backgrounds");
const communityCss=read("app/community/community.module.css");
assert.match(communityCss, /\.heroMotif:before,\.heroMotif:after,\.heroSpark\{display:none!important/, "Legacy Community ornaments must remain absent");
const manager=read("components/ManagerWorkspace.tsx");
const species=read("components/SpeciesDashboardWorkspace.tsx");
assert.match(manager, /WorkspaceEditToolbar/, "Manager must use the shared edit toolbar");
assert.match(species, /WorkspaceEditToolbar/, "Species workspace must use the shared edit toolbar");
assert.match(read("components/HomeWidgets.tsx"), /WorkspaceEditToolbar/, "Home must use the shared edit toolbar");
console.log("Legacy icon regression checks passed across " + allComponents.length + " TSX and " + allStyles.length + " CSS surfaces.");
