"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

type PresenceState =
  | { status: "connecting" | "unavailable"; count: null }
  | { status: "connected"; count: number };

const PresenceContext = createContext<PresenceState>({ status: "connecting", count: null });

/** Approximate active browser sessions, never identified members or visitor history. */
function isPodscapePortal(pathname: string | null): boolean {
  if (!pathname) return false;
  return ["/app", "/community", "/fun-zone", "/keeper", "/ledger", "/shop", "/field-guide",
    "/podbound", "/menu", "/from-the-lab", "/account", "/search", "/poddex", "/explore"
  ].some(prefix => pathname === prefix || pathname.startsWith(prefix + "/"));
}

export function OnlinePresenceProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const enabled = isPodscapePortal(pathname);
  const [presence, setPresence] = useState<PresenceState>({ status: "connecting", count: null });

  useEffect(() => {
    if (!enabled) return;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;

    // Presence is intentionally anonymous. A random key lives only for this tab's connection.
    // Do NOT use a Supabase secret key, member ID, email or account metadata here.
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
    const channel = client.channel("podscape-active-sessions-v1", {
      config: { presence: { key: crypto.randomUUID() } }
    });
    let closed = false;
    let joined = false;
    let announced = false;
    let lastInteraction = Date.now();
    let inFlight = false;
    let liveStatus: "connecting" | "connected" | "unavailable" = "connecting";
    const idleMs = 10 * 60_000;

    function sync() {
      if (closed || !announced) return;
      // A Presence key represents one connected browser tab, not a verified unique user.
      const count = Object.values(channel.presenceState()).filter(items => items.length > 0).length;
      setPresence({ status: "connected", count });
    }
    async function reconcile() {
      if (closed || !joined || inFlight) return;
      const active = navigator.onLine && document.visibilityState === "visible" && Date.now() - lastInteraction < idleMs;
      if (announced === active) return;
      inFlight = true;
      try {
        if (active) {
          const outcome = await channel.track({ online: true });
          if (closed) return;
          if (outcome !== "ok") {
            liveStatus = "unavailable";
            setPresence({ status: "unavailable", count: null });
          } else {
            announced = true;
            sync();
          }
        } else {
          await channel.untrack();
          announced = false;
          // Background/idle tabs are no longer considered active.
          setPresence({ status: "connecting", count: null });
        }
      } catch {
        if (!closed) {
          liveStatus = "unavailable";
          setPresence({ status: "unavailable", count: null });
        }
      } finally { inFlight = false; }
    }
    function onInteraction() {
      lastInteraction = Date.now();
      // Only re-track once when returning from idle, never on every interaction.
      if (joined && !announced) void reconcile();
    }
    function onVisibility() {
      if (document.visibilityState === "visible") lastInteraction = Date.now();
      void reconcile();
    }

    channel.on("presence", { event: "sync" }, sync);
    channel.subscribe(status => {
      if (closed) return;
      if (status === "SUBSCRIBED") {
        joined = true;
        liveStatus = "connected";
        void reconcile();
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        joined = false;
        announced = false;
        liveStatus = "unavailable";
        setPresence({ status: "unavailable", count: null });
      }
    });

    const onOnline = () => { lastInteraction = Date.now(); void reconcile(); };
    const onOffline = () => { void reconcile(); };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    for (const event of ["pointerdown", "keydown", "touchstart", "scroll"] as const) {
      window.addEventListener(event, onInteraction, { passive: true });
    }
    const monitor = window.setInterval(() => { if (liveStatus === "connected") void reconcile(); }, 30_000);

    return () => {
      closed = true;
      window.clearInterval(monitor);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      for (const event of ["pointerdown", "keydown", "touchstart", "scroll"] as const) {
        window.removeEventListener(event, onInteraction);
      }
      void client.removeChannel(channel);
    };
  }, [enabled]);

  return <PresenceContext.Provider value={presence}>{children}</PresenceContext.Provider>;
}

export function useOnlinePresence() {
  return useContext(PresenceContext);
}
