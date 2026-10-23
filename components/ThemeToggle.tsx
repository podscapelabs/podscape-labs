"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "./Icons";

type Theme = "light" | "dark";
type ThemePreference = Theme | "system";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [preference, setPreference] = useState<ThemePreference>("system");

  useEffect(() => {
    const sync = () => {
      const saved = localStorage.getItem("podscape-theme");
      setPreference(saved === "light" || saved === "dark" || saved === "system" ? saved : "system");
      setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    };
    sync();
    window.addEventListener("podscape-theme-change", sync);
    return () => window.removeEventListener("podscape-theme-change", sync);
  }, []);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    document.documentElement.dataset.themePreference = next;
    document.documentElement.style.colorScheme = next;
    localStorage.setItem("podscape-theme", next);
    setTheme(next);
    setPreference(next);
    window.dispatchEvent(new CustomEvent("podscape-theme-change", { detail: next }));
  }

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label={`${preference === "system" ? "Following device appearance. " : ""}Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`${preference === "system" ? "Following device · " : ""}${theme === "dark" ? "Use light mode" : "Use dark mode"}`}
    >
      <span className="theme-icon theme-icon-sun"><SunIcon /></span>
      <span className="theme-icon theme-icon-moon"><MoonIcon /></span>
    </button>
  );
}
