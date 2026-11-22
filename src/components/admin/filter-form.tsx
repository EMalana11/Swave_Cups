import type { FormEvent, ReactNode } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * A search/filter form that stores its values in the URL (`?q=…&status=…`), so results can be bookmarked, shared and
 * survive a refresh. Empty fields are dropped and the page number resets to 1.
 */
export function FilterForm({ children, className }: { children: ReactNode; className?: string }) {
  const [params, setParams] = useSearchParams();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = new URLSearchParams();
    for (const [key, value] of new FormData(event.currentTarget)) {
      if (typeof value === "string" && value.trim()) next.set(key, value.trim());
    }
    setParams(next);
  }

  // `key` re-syncs the fields with the URL after back/forward navigation.
  return <form key={params.toString()} onSubmit={handleSubmit} className={className} role="search">{children}</form>;
}
