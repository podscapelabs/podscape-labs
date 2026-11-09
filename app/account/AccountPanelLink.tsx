"use client";

import type { ReactNode, MouseEvent } from "react";

/** Open a closed Account panel before navigating to its anchor. */
export function AccountPanelLink({ href, children }: { href: `#${string}`; children: ReactNode }) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const id = href.slice(1);
    const panel = document.getElementById(id);
    if (!(panel instanceof HTMLDetailsElement)) return;
    event.preventDefault();
    panel.open = true;
    window.history.replaceState(null, "", href);
    panel.scrollIntoView({ behavior: "auto", block: "start" });
    panel.querySelector("summary")?.focus({ preventScroll: true });
  }
  return <a href={href} onClick={handleClick}>{children}</a>;
}
