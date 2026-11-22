import { Link, useRouteError } from "react-router-dom";

/** Shown when a page crashes unexpectedly. Expected "not found" cases use the NotFound page instead. */
export function RouteError() {
  const error = useRouteError();
  console.error("[route]", error);
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-extrabold text-navy">Something went wrong</h1>
      <p className="mt-2 text-muted">Please try again. If it keeps happening, let the cafe know.</p>
      <div className="mt-6 flex justify-center gap-3">
        <button type="button" onClick={() => window.location.reload()} className="btn btn-solid">Reload page</button>
        <Link to="/" className="btn btn-line">Back home</Link>
      </div>
    </div>
  );
}
