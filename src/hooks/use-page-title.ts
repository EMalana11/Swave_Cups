import { useEffect } from "react";

const SITE = "Swave Cups Cafe";
const DEFAULT_TITLE = `${SITE} · Canaman, Camsur`;

/** Sets the browser tab title: "Page · Swave Cups Cafe". Pass a suffix for sections, e.g. "Admin". */
export function usePageTitle(title?: string | null, suffix = SITE) {
  useEffect(() => {
    document.title = title ? `${title} · ${suffix}` : DEFAULT_TITLE;
  }, [title, suffix]);
}
