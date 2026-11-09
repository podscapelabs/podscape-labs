import {readFileSync} from "node:fs";
import {strict as assert} from "node:assert";
import {fileURLToPath} from "node:url";
import path from "node:path";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=(name)=>readFileSync(path.join(root,name),"utf8");
const global=read("app/globals.css");
const portals=[
 "app/fun-zone/fun-zone.module.css",
 "app/community/community.module.css",
 "components/SpeciesProfile.module.css"
];
const roles=[
 "--portal-hero-start","--portal-hero-end","--portal-hero-glow",
 "--portal-hero-text","--portal-hero-muted","--portal-hero-soft",
 "--portal-hero-button-bg","--portal-hero-button-text","--accent-contrast"
];
const light=global.split(".v2-site {")[1]?.split(":root[data-theme=\"dark\"] .v2-site {")[0]||"";
const dark=global.split(':root[data-theme="dark"] .v2-site {')[1]?.split("\n}")[0]||"";
assert(light&&dark,"Shared .v2-site palettes must exist for both themes.");
for(const role of roles){
 assert(light.includes(role+":"),"Light theme is missing "+role);
 assert(dark.includes(role+":"),"Dark theme is missing "+role);
}
for(const name of portals){
 const css=read(name);
 assert(css.includes("var(--portal-hero-start)"),name+" must use shared hero start colour");
 assert(css.includes("var(--portal-hero-end)"),name+" must use shared hero end colour");
 if(name.includes("fun-zone")||name.includes("community")){
  assert(!css.includes("var(--forest)"),name+" uses legacy forest text colour; use --accent or a portal colour role");
 }
}
assert(read("app/fun-zone/fun-zone.module.css").includes("var(--accent-contrast)"),"Fun Zone active filters must use contrast-aware foreground.");
console.log("Portal colour tokens validated for light/dark themes, Leaf Ledger, Fun Zone, and Community.");
