# PodScape cross-device preferences — first release

**Status:** Source complete and QA verified on unified development branch. **Not deployed.**
**Scope:** Home widget order/visibility, six Home shortcuts, five bottom navigation shortcuts, Manager widget order/visibility and six Quick Tools, plus the shared Species Dashboard widget order/visibility.
**Out of scope:** Pinned favorites, colony records, EXP, appearance, shopping and other personal data. Manager and Species sync *layouts only*—never species facts, care events or colony data.

## Release order

1. Review the migration `supabase/migrations/20261110150000_member_ui_preferences.sql` and validate it against the exact production Supabase project.
2. Apply the table/policies once during the coordinated release. **Never deploy the app before the table exists**, since the sync bridge will otherwise report unavailable cloud preferences.
3. Run Supabase security advisors and verify authenticated member A cannot SELECT, INSERT or UPDATE member B's row. Ensure anonymous clients cannot access the table.
4. Deploy the verified unified commit to the production Vercel project serving both `podscapelabs.com` and `www.podscapelabs.com`.
5. Test iOS PWA, Safari and desktop on at least two independent authenticated sessions.

## Safeguards

- The existing local keys remain unchanged (`podscape-home-widgets-v2`, `podscape-nav-v1-home`, `podscape-nav-v1-bottom`, `podscape-manager-layout-v1:<user-id>`, `podscape-species-dashboard-v1:<user-id>`), including legacy layout readers for all three dashboards.
- No saved layout is deleted and **no cloud account copy is overwritten without a matching revision**.
- A first device with only default settings does not create a misleading cloud default.
- If the account is empty but the device has custom settings, a visible choice offers to save **this device** to the account.
- An account with cloud settings restores them automatically on a device with defaults or a device matching its last-synced snapshot.
- When two separately customized devices disagree, the interface offers **Use this device & sync** or **Use account layout**. No timestamp-based arbitrary winner.
- Home, Manager, Species and navigation editing continue to save locally immediately. Background sync can fail independently without affecting the local layout.
- The app checks for newer cloud revisions when regaining focus/visibility. Simultaneous writes use compare-and-swap revision checks, returning 409 when an account copy changed first.
- Only confirmed/approved members are authorized by the server route; Supabase additionally enforces `auth.uid() = user_id` RLS. There are no publicly shared preference records.
- No service-role key is exposed to browsers.

## Manual two-device acceptance test

1. Sign in as the same confirmed tester on A and B. Customize Home, Manager, Species Dashboard and bottom toolbar on A.
2. Verify cloud sync saves the choices and B receives them on a clean/default setup. Refresh B; Home, Manager, Species widget order/visibility and all quick shortcuts must remain the same.
3. Customize B offline and A separately, then reconnect B. Verify conflict prompt rather than silent overwrite. Exercise **both** choices.
4. Open two tabs, edit Manager widgets, Species widgets and shortcuts; verify both local storage events and the new workspace event keep them coherent.
5. Verify the first existing user with customized *local* settings and no cloud row gets an import choice, while a user with no custom settings sees no unnecessary prompt.
6. Sign out and back into another account. Do not upload the previous account's local settings automatically; no cross-account cloud reads should be possible.
7. Deny or interrupt network access: saved local dashboards and navigation must keep working, and retry must not erase data.
8. On iPhone, press-and-hold to edit and verify the PWA bottom navigation, no blocked touch controls, and safe-area aware conflict panel.

## Further phases

Manager and Species are now included in the staged schema and adapter. Follow up with the same two-device iPhone/desktop acceptance tests **before release**. Other data (favorites, care records, account data and personal content) requires a separate schema and privacy review; do not broaden this sync automatically.
