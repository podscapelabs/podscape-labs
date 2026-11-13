/** Single interaction contract for editable PodScape dashboards and navigation. */
export const EDIT_HOLD_MS = 500;
export const EDIT_MOVE_CANCEL_PX = 11;
export const EDIT_CLICK_SUPPRESS_MS = 1100;

/** Confirmation text uses consistent, user-friendly boundaries and never implies data deletion. */
export function confirmWorkspaceReset(
 area:"home"|"fun-zone"|"manager"|"species"|"home-shortcuts"|"manager-shortcuts"|"bottom-navigation"|"portal-shortcuts"
):boolean {
 const messages:Record<typeof area,string>={
  home:"Reset Home to its default layout? Optional widgets and their arrangement will change. Your colonies, favorites and account data stay safe.",
  "fun-zone":"Reset Fun Zone to its default layout? Your favourite games, puzzle completions and account progress will stay safe.",
  manager:"Reset Manager to its default dashboard and Quick Tools? Your colonies, care history and saved records will not be deleted.",
  species:"Reset the Species Dashboard layout for all species? Your collection and species information will stay safe.",
  "home-shortcuts":"Reset your Home shortcuts to their defaults? This won't change the rest of your dashboard or delete any data.",
  "manager-shortcuts":"Reset Manager Quick Tools to their defaults? Your colonies and care records will stay safe.",
  "bottom-navigation":"Reset your bottom navigation shortcuts to their defaults? Your dashboards and account data will not change.",
  "portal-shortcuts":"Reset these portal shortcuts to their defaults? Your widgets, collections and account data will stay unchanged."
 };
 return typeof window!=="undefined" && window.confirm(messages[area]);
}
