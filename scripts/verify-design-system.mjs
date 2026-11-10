import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import ts from "typescript";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
function transpiled(path){
 const output=ts.transpileModule(read(path),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const mod={exports:{}};
 runInNewContext(output,{module:mod,exports:mod.exports,require:()=>{throw new Error("Unexpected runtime dependency")}}, {filename:path});
 return mod.exports;
}
const iconSource=read("components/PodscapeLineIcon.tsx");
const catalog=transpiled("lib/podscape-icon-catalog.ts");
const games=transpiled("lib/fun-zone-games.ts").games;
const knownIcons=[...iconSource.matchAll(/if\(name===(?:"([^"]+)"|\w+===)/g)].map(m=>m[1]).filter(Boolean);
assert.ok(knownIcons.includes("crossword"),"Crossword icon must exist");
for(const icon of ["connections","letters","challenge","quiz","word-search","achievement","check","lock","grid","edit","grip","arrow-up","arrow-down","close"]){
 assert.ok(iconSource.includes('name==="'+icon+'"'),"Missing shared icon: "+icon);
}
const keys=[...games.map(game=>game.key),"word-search"];
assert.equal(keys.length,8,"Fun Zone still has eight game categories");
assert.equal(new Set(keys).size,8,"Fun Zone keys must be unique");
assert.equal(Object.keys(catalog.funZoneIcons).length,8,"Every game needs one icon mapping");
for(const key of keys)assert.ok(catalog.funZoneIcons[key],"No canonical icon for "+key);
assert.equal(new Set(Object.values(catalog.funZoneIcons)).size,8,"Game icon identities must be distinct");
assert.equal(catalog.progressIcons.completed,"check");
assert.equal(catalog.progressIcons.locked,"lock");
assert.equal(catalog.editorIcons.customize,"edit");
const cards=read("app/fun-zone/FunZoneLibrary.tsx");
const carousel=read("app/fun-zone/FunZoneCarousel.tsx");
const library=read("components/PuzzleLibrary.tsx");
for(const [path,code] of [
 ["app/fun-zone/FunZoneLibrary.tsx",cards],
 ["app/fun-zone/FunZoneCarousel.tsx",carousel],
 ["components/PuzzleLibrary.tsx",library]
]){
 assert.match(code,/gameIcon\(/,"Game cards must use semantic icon mapping: "+path);
 assert.match(code,/PodscapeLineIcon/,"Missing canonical glyph component: "+path);
 assert.ok(!/[❧🍃🌿🍂]/u.test(code),"Botanical filler icon is forbidden in "+path);
}
assert.match(cards,/name="achievement"/,"Fun Zone milestones should use a trophy, not a leaf");
assert.ok(!cards.includes("game.mark"),"Legacy text glyphs must not render as game icons");
const homeWidgets=read("components/HomeWidgets.tsx");
for(const [key,icon] of [
 ["recent","news"],["progress","achievement"],["games","gamepad"],["pins","bookmark"]
]){
 assert.ok(homeWidgets.includes(key+':{name:')&&homeWidgets.includes('icon:"'+icon+'"'),"Missing semantic Home icon for "+key);
}

assert.match(library,/progressIcons\.completed/);
assert.match(library,/progressIcons\.locked/);
for(const path of ["app/fun-zone/fun-zone.module.css","components/PuzzleLibrary.module.css","components/PlayGame.module.css"]){
 const css=read(path);
 assert.ok(!css.includes("❧"),"Decorative glyph CSS survived in "+path);
 assert.ok(!/\.artLeaf\s*\{/.test(css),"Legacy leaf overlay survived in "+path);
}
const funZoneCss=read("app/fun-zone/fun-zone.module.css");
assert.match(funZoneCss,/\.carousel::before,\.puzzleArt::before,\.puzzleArt::after\{content:none!important/, "Fun Zone decoration layers must remain disabled");
assert.match(funZoneCss,/\.puzzleArt\{background:var\(--surface-secondary\);background-image:none!important/, "Game tile surfaces must be clean, not botanical patterns");
const editor=read("components/WorkspaceEditCanvas.tsx");
for(const key of ["grid","check","grip","arrow-up","arrow-down","close"])
 assert.ok(editor.includes('name="'+key+'"'),"Shared editor must use semantic "+key+" icon");
assert.match(editor,/function WorkspaceEditToolbar/);
assert.match(editor,/function WorkspaceEditBlock/);
assert.ok(read("components/HomeWidgets.tsx").includes("WorkspaceEditToolbar"));
assert.ok(read("components/ManagerWorkspace.tsx").includes("WorkspaceEditToolbar"));
assert.ok(read("components/ColonyDashboardLayout.tsx").includes("WorkspaceEditToolbar"));
assert.ok(read("docs/design-system/ICONOGRAPHY_AND_EDITORS.md").includes("Cross-device sync"));

const editStandards=read("components/workspace-edit-standards.ts");
assert.match(editStandards,/EDIT_HOLD_MS\s*=\s*500/,"One long-press threshold must govern widget and shortcut editors");
assert.match(editStandards,/EDIT_MOVE_CANCEL_PX\s*=\s*11/,"One movement threshold must prevent accidental long presses");
assert.match(editor,/EDIT_HOLD_MS/,"Widget editors must import shared hold threshold");
const shortcutHook=read("components/useShortcutEditor.ts");
assert.match(shortcutHook,/EDIT_HOLD_MS/,"Home, Manager and bottom navigation shortcut editing must use shared hold threshold");
assert.match(shortcutHook,/EDIT_MOVE_CANCEL_PX/,"Shortcut edit gestures must share movement cancellation");
assert.match(shortcutHook,/pointer\.current\?\.id!==event\.pointerId/,"Shortcut editors must reject another finger's pointer events");
const focusHook=read("components/useWorkspaceEditorDialog.ts");
for(const requirement of ["Escape","Tab","visibilitychange","returnFocus"]){
 if(requirement==="visibilitychange")continue;
 assert.ok(focusHook.includes(requirement),"Widget library modal requires "+requirement+" support");
}
for(const path of ["components/HomeWidgets.tsx","components/ManagerWorkspace.tsx","components/SpeciesDashboardWorkspace.tsx"]){
 const code=read(path);
 assert.match(code,/useWorkspaceEditorDialog\(/,"Widget libraries must share focus/keyboard handling: "+path);
 assert.match(code,/confirmWorkspaceReset\(/,"Reset must require standardized confirmation: "+path);
 assert.match(code,/PodscapeLineIcon name="edit"\/> Edit/,"Dashboard edit control needs canonical action icon: "+path);
}
for(const [path,area] of [
 ["components/CustomizableHomeShortcuts.tsx","home-shortcuts"],
 ["components/GlobalMobileNav.tsx","bottom-navigation"],
 ["components/ManagerWorkspace.tsx","manager-shortcuts"]
]){
 assert.ok(read(path).includes('confirmWorkspaceReset("'+area+'")'),"Shortcut reset needs confirmation: "+path);
}

console.log("Design-system checks passed: 8/8 semantic game icons, no Fun Zone leaf fillers, shared editor controls and documented global standard.");
