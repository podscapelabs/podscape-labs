import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type SignupDay = { day: string; count: number };
export type OwnerAnalyticsStats = {
  accounts: number | null;
  confirmed: number | null;
  last24h: number | null;
  last7d: number | null;
  last30d: number | null;
  registrationsByDay: SignupDay[];
  activeBins: number | null;
  memberProfiles: number | null;
  approvedTesters: number | null;
  accountError: boolean;
};

function countResult(value: number | null, error: unknown) {
  return error ? null : value;
}

/**
 * Owner-only, aggregate-only snapshot. Never return email, ID, signup IP, or any other
 * individual account information to the client.
 */
export async function getOwnerAnalyticsStats(): Promise<OwnerAnalyticsStats> {
  const now = new Date();
  const byDate = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const utc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    byDate.set(utc.toISOString().slice(0, 10), 0);
  }
  const empty: OwnerAnalyticsStats = {
    accounts: null, confirmed: null, last24h: null, last7d: null, last30d: null,
    registrationsByDay: [...byDate].map(([day, count]) => ({day, count})),
    activeBins: null, memberProfiles: null, approvedTesters: null, accountError: true
  };
  const supabase = getSupabaseAdmin();
  if (!supabase) return empty;

  const [bins, profiles, testers] = await Promise.all([
    supabase.from("keeper_enclosures").select("id", {count:"exact", head:true}).eq("is_archived", false),
    supabase.from("customer_profiles").select("id", {count:"exact", head:true}),
    supabase.from("early_access_testers").select("email", {count:"exact", head:true}).eq("active", true),
  ]);
  empty.activeBins = countResult(bins.count, bins.error);
  empty.memberProfiles = countResult(profiles.count, profiles.error);
  empty.approvedTesters = countResult(testers.count, testers.error);

  // GoTrue Admin pagination is server-only. This is inexpensive for early access;
  // if the platform grows beyond the safety cap, don't show a misleading partial
  // 7/30-day number. A future server-only aggregate SQL RPC can replace this.
  try {
    const users: { created_at: string; confirmed_at?: string | null }[] = [];
    const perPage = 1000;
    const maxPages = 20;
    let totalFromApi: number | null = null;
    let complete = false;
    for (let page = 1; page <= maxPages; page++) {
      const {data, error} = await supabase.auth.admin.listUsers({page, perPage});
      if (error || !data) throw error || new Error("Auth list unavailable");
      if (page === 1 && typeof data.total === "number") totalFromApi = data.total;
      users.push(...data.users.map(user=>({created_at:user.created_at,confirmed_at:user.confirmed_at})));
      if (data.users.length < perPage || (totalFromApi !== null && users.length >= totalFromApi)) {
        complete = true;
        break;
      }
    }
    empty.accounts = totalFromApi ?? (complete ? users.length : null);
    if (complete) {
      const inMs = (timestamp:string, days:number) => {
        const age = now.getTime() - Date.parse(timestamp);
        return Number.isFinite(age) && age >= 0 && age < days * 86400_000;
      };
      empty.confirmed = users.filter(user=>Boolean(user.confirmed_at)).length;
      empty.last24h = users.filter(user=>inMs(user.created_at,1)).length;
      empty.last7d = users.filter(user=>inMs(user.created_at,7)).length;
      empty.last30d = users.filter(user=>inMs(user.created_at,30)).length;
      for (const user of users) {
        const day = user.created_at?.slice(0,10);
        if (byDate.has(day)) byDate.set(day, (byDate.get(day)||0) + 1);
      }
      empty.registrationsByDay = [...byDate].map(([day, count]) => ({day, count}));
    }
    empty.accountError = !complete;
  } catch {
    // The account metrics fail closed instead of presenting fabricated zeros.
    empty.accountError = true;
  }
  return empty;
}
