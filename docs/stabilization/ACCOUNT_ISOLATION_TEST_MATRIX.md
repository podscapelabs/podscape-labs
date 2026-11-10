# Account Isolation and Permission Test Matrix (STAGING ONLY)
Status: designed; no live auth probing or destructive changes performed.

Use a disposable staging project and two ordinary, verified member accounts (Member A and Member B), plus a trusted Owner. Never reuse production cookies or secrets. Run each test against the authenticated **HTTP API** to exercise the actual Supabase/PostgREST/Storage authorization stack; catalog reviews alone cannot prove isolation.

| ID | Actor/action | Expected |
| --- | --- | --- |
| AUTH-01 | Anonymous user requests a member's enclosures/care events/preferences | No records, no mutation |
| AUTH-02 | Member A reads Member B enclosures | Denied / zero rows |
| AUTH-03 | Member A edits or deletes Member B enclosure | Denied / zero affected rows |
| AUTH-04 | Member A inserts care activity for Member B enclosure | Denied |
| AUTH-05 | Member A reads/deletes Member B care activity | Denied / zero rows |
| AUTH-06 | Member A reads/overwrites Member B UI preferences | Denied |
| AUTH-07 | Member A attempts to insert a collection entry with Member B user_id | Denied |
| VEND-01 | Anonymous user submits a vendor listing | Denied |
| VEND-02 | Unverified user submits a vendor listing | Denied |
| VEND-03 | Member A submits/edits Member B vendor listing | Denied |
| VEND-04 | Member A attempts to approve a vendor listing | Denied |
| VEND-05 | Vendor edits the profile after Owner loaded review; Owner submits stale approval | Denied; owner must reload |
| VEND-06 | Owner approves current pending version | Allowed; correct public listing appears |
| VEND-07 | Vendor edits approved listing | Status reverts to pending before public display |
| UPDT-01 | Non-owner creates/publishes/unpublishes an update | Denied |
| UPDT-02 | Anonymous user queries drafts | No draft records |
| STORE-01 | Member A updates any product-photos object | Denied (after proposed policy fix) |
| STORE-02 | Member A updates an object outside product-photos via product policy | Denied |
| STORE-03 | Owner updates authorized product photo | Allowed |
| STORE-04 | Anonymous or member tries to upload owner product photo | Denied |
| STORE-05 | Anonymous user requests public product/species/vendor image | Allowed by design |
| STORE-06 | Anonymous user requests private PodBound artwork | Denied |
| OWNER-01 | Non-owner requests Owner Studio page/server action | Redirect or denied |
| OWNER-02 | Owner sign-out or session expiry prevents further privileged actions | Denied |

## Race test: VEND-05
1. Create a pending test vendor as Member A.
2. Owner opens the review form and does not submit yet.
3. Member A edits the listing. Verify it remains pending and `updated_at` advances.
4. Owner submits the **old** review form. The server should report that the application changed.
5. Reopen the review form, inspect latest details, and approve.
6. Re-query public listing and confirm only the version actually reviewed is published.

## Storage policy fix acceptance
The observed `Owner updates product photographs` policy currently has no owner condition. Use a staging copy or isolated fixture, apply `proposals/PRODUCT_PHOTO_STORAGE_POLICY_REVIEW.sql` only after human review, then rerun STORE-01 through STORE-06. Check Storage API responses, not just `pg_policies`. Do not use genuine member uploads as a destructive test target.

## Integrity checks
Execute `READ_ONLY_DATABASE_CHECKS.sql` before and after each approved staging migration. Record aggregate counts only, and use the same two test members to validate no cross-tenant rows are returned.

## Exit criteria
All denial cases produce 401/403 or no affected rows (as expected by each API), all legitimate owner/member flows succeed, and no unreviewed vendor profile becomes public. Record actual test outcomes with environment ID, SHA and migration version. **None of these HTTP integration cases have been executed yet.**


## Executable read-only isolation harness
The repository now includes `scripts/test-account-isolation-staging.mjs`, invoked using `pnpm test:account-isolation:staging`. It runs **GET-only** HTTP tests against a Supabase staging instance and explicitly refuses the known production project URL. It never logs tokens or private returned rows.

Create an *approved* isolated Supabase development branch/staging project and populate **disposable** Member A and Member B fixture records. Pass the values as environment variables, not command-line arguments or committed files:

| Environment variable | Meaning |
| --- | --- |
| `PODSCAPE_STAGING_URL` | Supabase staging API origin |
| `PODSCAPE_STAGING_PUBLISHABLE_KEY` | Staging publishable key (not a secret/admin key) |
| `PODSCAPE_STAGING_MEMBER_A_TOKEN` | Short-lived Member A test access token |
| `PODSCAPE_STAGING_MEMBER_B_TOKEN` | Short-lived Member B test access token |
| `PODSCAPE_STAGING_MEMBER_A_ID` | Member A test user UUID |
| `PODSCAPE_STAGING_MEMBER_B_ID` | Member B test user UUID |
| `PODSCAPE_STAGING_PENDING_VENDOR_ID` | Optional pending-vendor test UUID |

Before running, A and B must each have an enclosure. B must have at least one member-species collection entry and a saved preferences row. The harness fails if fixtures are absent, which prevents a false-success result caused by empty test tables. The runner also checks no cross-account member views, progress events and pending vendor records are visible.

This does **not** cover mutations or object-storage PUT/PATCH/DELETE. Those remain mandatory isolated API tests in the matrix above. Staging fixtures must not use production user IDs, production cookies or live uploads.

Current result: **not executed** (no staging project or test credentials available). Do not mark account isolation as fully verified merely because the script exists.
