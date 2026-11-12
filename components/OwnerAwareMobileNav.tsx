import { isAdminAuthenticated } from "@/lib/admin-auth";
import { GlobalMobileNav } from "./GlobalMobileNav";
import { FloatingFeedback } from "./FloatingFeedback";
import { PreferenceSyncBridge } from "./PreferenceSyncBridge";
import { customerSupabase } from "@/lib/customer-auth/server";

/** Privileged destinations must not be offered based on local browser state. */
export async function OwnerAwareMobileNav() {
  const isOwner = await isAdminAuthenticated();
  const auth = await customerSupabase();
  const {data:{user}} = auth ? await auth.auth.getUser() : {data:{user:null}};
  return <><PreferenceSyncBridge userId={user?.email_confirmed_at ? user.id : null} isOwner={isOwner}/><GlobalMobileNav isOwner={isOwner}/><FloatingFeedback enabled={Boolean(user?.email_confirmed_at)}/></>;
}
