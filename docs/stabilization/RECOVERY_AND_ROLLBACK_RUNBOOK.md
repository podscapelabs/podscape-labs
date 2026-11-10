# PodScape Recovery and Rollback Runbook
Status: **Procedure drafted — restore rehearsal NOT completed**
Audit date: 2026-11-10

## Production systems
- GitHub: `podscapelabs/podscape-labs`, release candidate branch `codex/podscape-unified-release-20261109`
- Vercel project: `prj_7RyjnPePjJVBONXLcRe9D4wbUMa0` (the name contains preview; production domains are assigned to this project)
- Production domains: `podscapelabs.com`, `www.podscapelabs.com`
- Supabase project: `qptvfwmxmhmhdmfyuzbb`
- Data: member accounts, colony records, care logs, vendor profiles, platform updates, media objects, and more

## Preventive safety gates
1. Do not apply destructive migrations or alter production permissions before owner approval.
2. Review a proposed migration in the repository with rollback/forward steps.
3. Inspect Supabase project backup availability and retention in the dashboard **before** relying on managed backups. The backup tier/PITR configuration has not been verified.
4. Record an exact, reviewed Git commit SHA and the matching migration versions. Git code and DB schema must be compatible.
5. Keep a separate staging project or approved development branch for permission, multi-account, and restore testing. None exists as of 2026-11-10.
6. Never copy production passwords, sensitive member data, secrets, or private uploads to a public or shared environment.

## If a code release is broken
1. Identify the latest known-good READY production deployment in Vercel. Confirm project, team, domains, SHA, and target.
2. Determine whether the problem is isolated to code. If there is a schema migration, do **not** assume code rollback can undo it.
3. With owner approval, roll back/promote the reviewed known-good SHA using Vercel's supported rollback/promotion flow.
4. Verify main domain, sign-in, owner tools, Home/Manager/Leaf Ledger, shopping, care logging and account isolation.
5. Keep the failing SHA and build logs for investigation. Record the rollback in the audit register.

## If data is corrupt, missing, or overwritten
1. **Stop writes safely** before restoration planning. Avoid further destructive operations.
2. Determine the affected tables/objects, earliest known-good point, and whether storage uploads are separately recoverable.
3. Inspect managed backup/PITR configuration and retention; do not claim backups exist until verified.
4. Restore only into a non-production staging environment first. This may incur usage charges and requires owner approval.
5. Validate row counts, foreign keys, care event enclosure ownership, vendor approval records, content records and media references.
6. Reconcile changes since the restore point; record potentially lost writes with a user-impact assessment.
7. Only after staging checks, obtain explicit owner approval for a production recovery plan.
8. After recovery, test two distinct users, owner workflows, and application compatibility before reopening writes.

## If an auth or Storage policy is insecure
1. Assess blast radius from policy definition, explicit GRANTs, and logs without probing real accounts.
2. Prepare a least-privilege migration in a review-only proposal.
3. Test owner/non-owner access (read, insert, update, delete) in staging.
4. Apply the minimal production permission correction only after explicit approval.
5. Re-query `pg_policies` and run the API-level denial tests. Run Supabase security advisors again.
6. Never assume RLS by itself covers TRUNCATE or guarantees media confidentiality in a public bucket.

## Required isolated recovery acceptance
- A staging restore from a known backup/snapshot with timestamps and retention documented
- Repeatable read-only integrity queries in `READ_ONLY_DATABASE_CHECKS.sql` return expected counts
- Non-owner cannot write owner-managed product photos, vendor approvals or updates
- Each test user's colony, care logs and preferences inaccessible to the other
- Both code deployment and database migration rollback/roll-forward scenarios documented
- A signed-off release decision attached to the exact deploy SHA

## Current blockers
- No Supabase development branches found; staging cost/creation must be approved.
- Backup tier and latest successful backup have not been verified via an available connector.
- No real staging restore or two-user API isolation test has been completed.
- Vercel's most recent deployment limit may prevent new preview/production attempts; confirm when testing.

**Important:** This runbook is a plan, not evidence that PodScape currently has a verified backup or demonstrated restore capability.
