import type { ReactNode } from "react";
export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-2xl font-extrabold text-navy sm:text-3xl">{title}</h1>{subtitle && <p className="text-sm text-muted">{subtitle}</p>}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
export function StatCard({ label, value, hint, tone = "navy" }: { label: string; value: ReactNode; hint?: string; tone?: "navy" | "orange" | "green" | "red" }) {
  const c = { navy: "text-navy", orange: "text-orange", green: "text-emerald-700", red: "text-red-600" }[tone];
  return (<div className="card"><p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p><p className={`mt-1 text-3xl font-extrabold ${c}`}>{value}</p>{hint && <p className="mt-1 text-xs text-muted">{hint}</p>}</div>);
}
