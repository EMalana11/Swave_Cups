import { Link } from "react-router-dom";
import { usePageTitle } from "@/hooks/use-page-title";

export function NotFound() {
  usePageTitle("Page not found");
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-4xl font-extrabold text-navy">Page not found</h1>
      <p className="mt-2 text-muted">That page doesn&apos;t exist (or has moved).</p>
      <Link to="/" className="btn btn-solid mt-6">Back home</Link>
    </div>
  );
}
