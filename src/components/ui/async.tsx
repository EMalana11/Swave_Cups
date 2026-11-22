import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { PanelSkeleton } from "./skeletons";

interface AsyncProps<T> {
  query: UseQueryResult<T>;
  children: (data: T) => ReactNode;
  skeleton?: ReactNode;
  errorMessage?: string;
}

/** Renders a loading skeleton, a retryable error card, or the loaded data. */
export function Async<T>({ query, children, skeleton, errorMessage = "Could not load this page. Check your connection and try again." }: AsyncProps<T>) {
  if (query.isPending) return <>{skeleton ?? <PanelSkeleton />}</>;
  if (query.isError) {
    return (
      <div role="alert" className="card text-red-700">
        <p>{errorMessage}</p>
        <button type="button" className="btn btn-line btn-sm mt-3" onClick={() => query.refetch()}>Retry</button>
      </div>
    );
  }
  return <>{children(query.data)}</>;
}
