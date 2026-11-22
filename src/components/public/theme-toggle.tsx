import { useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "swave-theme";
const isDark = () => document.documentElement.classList.contains("dark");

/** Light/dark switch. The initial theme is applied by a tiny script in index.html so the page never flashes. */
export function ThemeToggle() {
  const [dark, setDark] = useState(isDark);

  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem(STORAGE_KEY, next ? "dark" : "light"); } catch { /* preference just won't be remembered */ }
    setDark(next);
  }

  const target = dark ? "light" : "dark";
  return (
    <button type="button" onClick={toggle} aria-label={`Switch to ${target} mode`} title={`Switch to ${target} mode`}
      className="theme-toggle inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white/80 text-navy transition hover:border-orange hover:text-orange">
      {dark ? <Sun className="h-5 w-5" aria-hidden /> : <Moon className="h-5 w-5" aria-hidden />}
    </button>
  );
}
