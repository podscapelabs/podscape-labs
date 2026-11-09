import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

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
console.log("Legacy portal icon regression checks passed across " + audited.length + " audited surfaces.");
