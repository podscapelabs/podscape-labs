#!/usr/bin/env node
/**
 * Read-only authenticated RLS smoke tests for an ISOLATED Supabase test project.
 * Never run against production; refuses the known production project ref.
 * All HTTP operations are GET. No credentials or returned rows are logged.
 *
 * Required environment:
 * PODSCAPE_STAGING_URL, PODSCAPE_STAGING_PUBLISHABLE_KEY,
 * PODSCAPE_STAGING_MEMBER_A_TOKEN, PODSCAPE_STAGING_MEMBER_B_TOKEN,
 * PODSCAPE_STAGING_MEMBER_A_ID, PODSCAPE_STAGING_MEMBER_B_ID.
 *
 * Fixture prerequisite: B must own >=1 keeper enclosure, a species collection
 * entry, and a preference row. A must also own an enclosure. See audit matrix.
 */
import assert from "node:assert/strict";

const names=[
 "PODSCAPE_STAGING_URL",
 "PODSCAPE_STAGING_PUBLISHABLE_KEY",
 "PODSCAPE_STAGING_MEMBER_A_TOKEN",
 "PODSCAPE_STAGING_MEMBER_B_TOKEN",
 "PODSCAPE_STAGING_MEMBER_A_ID",
 "PODSCAPE_STAGING_MEMBER_B_ID",
];
for(const n of names)assert.ok(process.env[n],`Missing ${n}; run only in staging with disposable fixtures`);
const host=new URL(process.env.PODSCAPE_STAGING_URL);
assert.equal(host.protocol,"https:","Staging project URL must use HTTPS");
assert.match(host.hostname,/^[a-z0-9-]+\.supabase\.co$/,"Expected a Supabase project hostname");
assert.ok(!host.hostname.startsWith("qptvfwmxmhmhdmfyuzbb."),"Refusing to test the production project");
assert.notEqual(process.env.PODSCAPE_STAGING_MEMBER_A_ID,process.env.PODSCAPE_STAGING_MEMBER_B_ID,"Need two distinct users");
for(const n of ["PODSCAPE_STAGING_MEMBER_A_ID","PODSCAPE_STAGING_MEMBER_B_ID"])
 assert.match(process.env[n],/^[0-9a-f-]{36}$/i,"Expected a test UUID");

const url=host.origin;
const apiKey=process.env.PODSCAPE_STAGING_PUBLISHABLE_KEY;
const A=process.env.PODSCAPE_STAGING_MEMBER_A_TOKEN;
const B=process.env.PODSCAPE_STAGING_MEMBER_B_TOKEN;
const aid=process.env.PODSCAPE_STAGING_MEMBER_A_ID;
const bid=process.env.PODSCAPE_STAGING_MEMBER_B_ID;
let count=0;
async function fetchRows(table,token,id,filter="user_id",extra=""){
 const params=new URLSearchParams({select:"*",[filter]:`eq.${id}`});
 if(extra)params.set("limit",extra);
 const response=await fetch(`${url}/rest/v1/${table}?${params}`,{
  method:"GET",cache:"no-store",
  headers:{apikey:apiKey,Authorization:`Bearer ${token}`,Accept:"application/json"}
 });
 assert.ok(response.status===200||response.status===401||response.status===403,
  `Unexpected HTTP status for ${table}: ${response.status}`);
 if(response.status!==200)return {denied:true,rows:[]};
 const rows=await response.json();
 assert.ok(Array.isArray(rows),`Expected rows from ${table}`);
 return {denied:false,rows};
}
async function owns(table,token,id,filter="user_id"){
 const result=await fetchRows(table,token,id,filter);
 assert.ok(!result.denied&&result.rows.length>0,`Missing staging fixture for ${table}; create a test row owned by ${id===aid?"A":"B"}`);
 ++count;
}
async function isolated(table,token,id,filter="user_id"){
 const result=await fetchRows(table,token,id,filter);
 assert.ok(result.denied||result.rows.length===0,`ACCOUNT ISOLATION FAILURE: ${table} returned cross-user rows`);
 ++count;
}
await owns("keeper_enclosures",A,aid);
await owns("keeper_enclosures",B,bid);
await isolated("keeper_enclosures",A,bid);
await isolated("keeper_enclosures",B,aid);
await owns("member_species_collection",B,bid);
await isolated("member_species_collection",A,bid);
await owns("member_ui_preferences",B,bid);
await isolated("member_ui_preferences",A,bid);
await isolated("member_ui_preferences",B,aid);
await isolated("member_species_views",A,bid);
await isolated("member_progress_events",A,bid);
// The published-vendor SELECT policy must not expose pending applications.
if(process.env.PODSCAPE_STAGING_PENDING_VENDOR_ID){
 const pending=process.env.PODSCAPE_STAGING_PENDING_VENDOR_ID;
 assert.match(pending,/^[0-9a-f-]{36}$/i);
 await isolated("vendor_profiles",A,pending,"id");
 await isolated("vendor_profiles",B,pending,"id");
}
console.log(`Staging read-only isolation checks passed (${count} assertions; no user records displayed).`);
