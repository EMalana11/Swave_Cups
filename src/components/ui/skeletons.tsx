/** Placeholder while an admin page loads. */
export function PanelSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-28" />)}
      </div>
      <div className="skeleton h-64" />
    </div>
  );
}

/** Placeholder while a public page loads. */
export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-12" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-10 w-72" />
      <div className="skeleton h-5 w-full max-w-lg" />
      <div className="skeleton h-72 w-full" />
    </div>
  );
}
