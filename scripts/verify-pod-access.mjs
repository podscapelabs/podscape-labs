import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path)=>readFileSync(path,"utf8");
const page=read("app/page.tsx");
const access=read("components/MaintenanceMemberAccess.tsx");
const pageStyles=read("app/pod-access.module.css");
const accessStyles=read("components/MaintenanceMemberAccess.module.css");
const auth=read("app/account/actions.ts");
const icons=read("components/PodscapeLineIcon.tsx");
const theme=read("lib/theme-registry.ts");

assert.match(page,/className=\{\x60v2-site/,"Pod Access must use shared platform theme tokens");
assert.match(page,/Public launch in preparation/,"Guests should see maintenance status");
assert.match(page,/A little world is already open/,"Gate should use new PodScape brand voice");
assert.match(page,/testerAccessStatus\(verifiedEmail\)/,"Server checks confirmed, approved members");
assert.match(page,/user\?\.email_confirmed_at/,"Unverified member cannot bypass access gate");
assert.match(page,/<MaintenanceMemberAccess approved=\{approved\}\/>/,"Auth should use existing embedded panel");
assert.match(page,/href="#member-access"/,"Entry CTA must scroll to auth");
assert.match(page,/href="\/app"/,"Verified approved users should enter app directly");
assert.match(page,/https:\/\/podbound\.net/,"Existing PodBound destination remains available");
assert.match(page,/styles\.exploreGrid/,"Guest intro shows a concise feature overview");
assert.match(access,/CustomerAccountForm key=\{mode\} kind=\{mode\} embedded/,"Auth uses existing secured server actions");
assert.match(access,/aria-pressed=\{mode==="login"\}/,"Sign-in toggle exposes active state");
assert.match(access,/aria-pressed=\{mode==="sign-up"\}/,"Create-account toggle exposes active state");
assert.match(access,/approved\?<div className=\{styles\.signedIn\}/,"Approved members bypass redundant form");
assert.match(access,/Verification required/,"Unverified accounts must confirm email");
assert.match(auth,/testerAccessStatus\(email\)/,"Server signup continues enforcing allowlist");
assert.match(auth,/validNewPassword\(password\)/,"Password safety remains in auth actions");
for(const name of ["light","dark","woodland","lilac","ember"])assert.ok(theme.includes('id:"'+name+'"'),"Theme missing: "+name);
for(const token of ["--theme-background","--theme-surface","--theme-portal-hero-start","--theme-accent","--theme-portal-hero-text"])assert.ok(pageStyles.includes(token),"Missing theme role "+token);
for(const style of ["@media(max-width:850px)","@media(max-width:560px)","@media(max-width:365px)"])assert.ok(pageStyles.includes(style),"Mobile breakpoint missing: "+style);
assert.match(accessStyles,/\.form :global\(form input\)/,"Embedded form must be restyled");
assert.match(accessStyles,/min-height:43px/,"Mobile-friendly field height");
for(const [,name] of [...page.matchAll(/<PodscapeLineIcon name="([^"]+)"/g),...access.matchAll(/<PodscapeLineIcon name="([^"]+)"/g)]){
 assert.ok(icons.includes('"'+name+'"'),"Unsupported canonical icon: "+name);
}
assert.doesNotMatch(page,/signUp\(|admin\.auth|updateUserById/,"Home page should not mutate auth");
console.log("Pod Access UI, invite-only auth and five-theme regression checks passed.");
