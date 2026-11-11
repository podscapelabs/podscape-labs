import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
const carousel=read("app/fun-zone/FunZoneRankingsSpotlight.tsx");
const portal=read("app/fun-zone/FunZonePortal.tsx");
const policy=read("components/workspace-widget-policy.ts");
const css=read("app/fun-zone/fun-zone-portal.module.css");
const icons=read("components/PodscapeLineIcon.tsx");
const expected=[
 ["Arcade Leaders","/api/fun-zone/rankings?period=weekly&game=all"],
 ["Lifetime EXP","/api/progress/rankings"],
 ["The Rich List","/api/fun-zone/pod-exchange/rankings"],
 ["Top Investors","return"],
 ["Market Movers","weekly"]
];
for(const [title,source] of expected){
 assert.ok(carousel.includes(title),title+" slide missing");
 assert.ok(carousel.includes(source),title+" data source missing");
}
assert.match(carousel,/Promise\.all\(/,"Load the three leaderboard APIs in parallel");
assert.match(carousel,/rows\.slice\(0,3\)/,"Each board shows its top three only");
assert.match(carousel,/board\.mine/,"Show the signed-in member their own rank");
assert.match(carousel,/market\?\.participating/,"Never pretend the member opted into market rankings");
assert.match(carousel,/scrollTo\(/,"Carousel arrows should scroll horizontally");
assert.match(carousel,/onScroll=\{onScroll\}/,"Touch swipes should update active page");
assert.match(carousel,/aria-current=\{active===i/,"Active page dots need a readable state");
assert.match(carousel,/href=\{slide.href\}/,"Every slide links to its full ranking page");
assert.match(carousel,/document\.hidden/,"Avoid polling when the page is not visible");
assert.match(carousel,/controller\.abort\(\)/,"Stop network requests when unmounting");
assert.match(carousel,/Standings temporarily unavailable/,"One API error must not blank the entire widget");
assert.match(carousel,/market&&!state\.market\.weeklyReady/,"Show pending weekly baselines accurately");
assert.match(portal,/const defaultOrder:WidgetKey\[\]=\["rankings"/,"Spotlight should start near the top");
assert.match(portal,/const defaultVisible:WidgetKey\[\]=\["rankings"/,"New dashboards should show the Spotlight");
assert.match(portal,/if\(!order\.includes\("rankings"\)\)/,"Upgrade old dashboards once");
assert.match(portal,/if\(id==="rankings"\)return <FunZoneRankingsSpotlight/,"Widget must render");
assert.match(portal,/id==="rankings"\?"rankings-spotlight"/,"Shortcut anchor must be stable");
assert.match(portal,/href="#rankings-spotlight"/,"Rankings shortcut should jump to carousel");
assert.match(portal,/\["rankings","featured","categories","favourites","progress","exchange"\]/,"Widget library must include Rankings");
assert.match(policy,/rankings:\{group:"My Arcade"/,"Widget placement policy must include Rankings");
assert.match(css,/scroll-snap-type:x mandatory/,"Support native touchscreen swipe");
assert.match(css,/-webkit-overflow-scrolling:touch/,"Support iOS momentum swipe");
assert.match(css,/@media\(max-width:390px\)/,"Very narrow mobile layouts should be considered");
const iconNames=[...carousel.matchAll(/<PodscapeLineIcon name="([^"]+)"/g)].map(m=>m[1]);
for(const name of iconNames)assert.ok(icons.includes('"'+name+'"'),"Unsupported PodScape icon: "+name);
console.log("Fun Zone Rankings Spotlight source checks passed.");
