import { Link } from "react-router-dom";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({ title, children, icon }: { title: string; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-white/60 px-6 py-12 text-center">
      <div className="mb-3 text-muted">{icon ?? <Inbox className="h-8 w-8" aria-hidden />}</div>
      <h3 className="text-lg font-bold">{title}</h3>
      {children && <div className="mt-1 max-w-md text-sm text-muted">{children}</div>}
    </div>
  );
}

export function ProgressBar({ value, className, label }: { value: number; className?: string; label?: string }) {
  const percent = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-line", className)} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? "Progress"}>
      <div className="h-full rounded-full bg-orange transition-all" style={{ width: `${percent}%` }} />
    </div>
  );
}

interface PaginationProps { page: number; pages: number; basePath: string; params: Record<string, string | undefined> }

export function Pagination({ page, pages, basePath, params }: PaginationProps) {
  if (pages <= 1) return null;
  const href = (target: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
    query.set("page", String(target));
    return `${basePath}?${query}`;
  };
  const disabled = "btn btn-line btn-sm opacity-40";
  return (
    <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Pagination">
      <span className="text-muted">Page {page} of {pages}</span>
      <div className="flex gap-2">
        {page > 1 ? <Link className="btn btn-line btn-sm" to={href(page - 1)}>Previous</Link> : <span className={disabled}>Previous</span>}
        {page < pages ? <Link className="btn btn-line btn-sm" to={href(page + 1)}>Next</Link> : <span className={disabled}>Next</span>}
      </div>
    </nav>
  );
}
