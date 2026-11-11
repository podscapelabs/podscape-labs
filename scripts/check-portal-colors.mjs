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
const funZoneScreens=[
 "components/PuzzleLibrary.module.css",
 "components/PlayGame.module.css",
 "app/fun-zone/leaderboard/leaderboard.module.css",
 "app/fun-zone/word-search/game.module.css"
];
const roles=[
 "--portal-hero-start","--portal-hero-end","--portal-hero-glow",
 "--portal-hero-text","--portal-hero-muted","--portal-hero-soft",
 "--portal-hero-button-bg","--portal-hero-button-text","--accent-contrast"
];
const registry=read("lib/theme-registry.ts");
const themeIds=[...registry.matchAll(/\{id:"([a-z-]+)",title:/g)].map(match=>match[1]);
assert.ok(themeIds.length>=5,"Five PodScape environments must be registered.");
const rootBlock=theme=>{
 const selector=theme==="light"?":root {":':root[data-theme="'+theme+'"]{';
 const position=global.indexOf(selector);
 assert(position>=0,"Missing theme definition: "+theme);
 const open=global.indexOf("{",position);
 return global.slice(open+1,global.indexOf("}",open));
};
const baseline=rootBlock("light");
for(const theme of themeIds){
 const section=rootBlock(theme);
 for(const role of roles){
  const canonical="--theme-"+role.slice(2);
  assert(section.includes(canonical+":")||baseline.includes(canonical+":"),
   theme+" is missing "+canonical);
 }
}
const v2=global.split(".v2-site {")[1]?.split("\n}")[0]||"";
assert(v2,"Shared .v2-site role mapping is missing.");
for(const role of roles)assert(v2.includes(role+": var(--theme-"+role.slice(2)+")"),
 "Portal role must inherit the canonical theme token "+role);
for(const name of portals){
 const css=read(name);
 assert(css.includes("var(--portal-hero-start)"),name+" must use shared hero start colour");
 assert(css.includes("var(--portal-hero-end)"),name+" must use shared hero end colour");
 if(name.includes("fun-zone")||name.includes("community")){
  assert(!css.includes("var(--forest)"),name+" uses legacy forest text colour; use --accent or a portal colour role");
 }
}
for(const name of funZoneScreens){
 const css=read(name);
 assert(css.includes("var(--background)"),name+" must use shared background.");
 assert(!css.includes("var(--forest)"),name+" uses the legacy bright-green forest colour.");
}
assert(read("app/fun-zone/fun-zone.module.css").includes("var(--accent-contrast)"),"Fun Zone active filters must use contrast-aware foreground.");
console.log("Canonical palette roles validated for all registered themes and portal screens.");
