import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

const info=read("components/PodscapeInfoDialog.tsx");
const confirm=read("components/PodscapeConfirmDialog.tsx");
const modalCss=read("components/PodscapeInfoDialog.module.css");
assert.match(info,/showModal\(\)/,"Info sheets remain native modals");
assert.match(confirm,/showModal\(\)/,"Confirmation sheets must be native modals");
assert.match(confirm,/role="alertdialog"/,"Destructive confirmation must have an alertdialog role");
assert.match(confirm,/ref=\{cancelRef\}/,"The safe cancellation button receives focus first");
assert.match(confirm,/cancelRef\.current\?\.focus/,"The safer action is focused on opening");
assert.match(confirm,/event\.preventDefault\(\);if\(!pendingRef\.current\)/,"Escape must not bypass an in-flight operation");
assert.match(confirm,/document\.body\.style\.overflow=previousOverflow/,"Confirmation restores scroll state");
assert.match(confirm,/previousFocus\.focus/,"Confirmation restores focus to the invoking button");
assert.match(modalCss,/\.confirmActions/,"Information and confirmation use one shared sheet stylesheet");
assert.match(modalCss,/\.confirmDanger/,"Destructive action receives a consistent semantic role");
assert.match(modalCss,/\.close\{[^}]*width:44px;height:44px/,"Info close targets must be at least 44px");

const collection=read("components/CollectionButton.tsx");
assert.match(collection,/PodscapeConfirmDialog/,"Removing a saved species must use themed confirmation");
assert.match(collection,/if\(collected\)\{setConfirmOpen\(true\);return;\}/,"Only removal requires the extra confirmation");
assert.match(collection,/including archived bins/,"Archived bins must explicitly be protected");
assert.match(collection,/setSpeciesCollected\(speciesId, !collected, collected\)/,"Existing collection server action remains authoritative");
assert.doesNotMatch(collection,/window\.confirm/,"Collection removal should no longer use browser-native confirmation");
const lifecycle=read("components/BinLifecycleControls.tsx");
assert.match(lifecycle,/PodscapeConfirmDialog/,"Permanent bin deletion must use themed confirmation");
assert.match(lifecycle,/Delete bin permanently/,"Delete button must explicitly identify the irreversible action");
assert.match(lifecycle,/deleteEnclosure\(\{id,confirmed:true\}\)/,"Deletion still requires server-side confirmed flag");
assert.match(lifecycle,/setEnclosureArchived/,"Safe archiving must remain available");
assert.doesNotMatch(lifecycle,/window\.confirm/,"Bin deletion should no longer use browser-native confirmation");

const account=read("app/account/page.tsx");
const accountCss=read("app/account/account-dashboard.module.css");
const owner=read("app/account/owner-tools/page.tsx");
const ownerCss=read("app/account/owner-tools/page.module.css");
assert.match(account,/<WorkspaceHeader/,"Member Account should use shared workspace heading");
assert.match(account,/<WorkspaceSectionHeader title="Settings"/,"Settings should use shared section hierarchy");
assert.match(account,/href="\/account\/owner-tools" className=\{styles\.ownerStudioLink\}/,"Owner Studio must be one tap from Account");
assert.match(owner,/<OwnerDeskHeader area="Platform" title="Owner Studio"/,"Owner landing must inherit owner header");
assert.match(owner,/OwnerDeskDirectory/,"Deep owner desk directory stays available");
assert.match(owner,/TestAchievementButton/,"Owner QA controls remain available");
for(const [label,css] of [["Account",accountCss],["Owner Studio",ownerCss]]){
 for(const token of ["--ps-bg","--ps-surface","--ps-accent","--ps-border","--ps-focus"]){
  assert.ok(css.includes(token),label+" must use theme-semantic token "+token);
 }
 assert.ok(css.includes("safe-area-inset-bottom"),label+" must clear fixed mobile navigation");
}
console.log("PodScape visual refinement passed: Account/Owner hierarchy, shared five-theme surfaces, confirm safety, and preserved keeper records.");
