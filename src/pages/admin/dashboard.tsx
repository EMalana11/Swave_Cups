import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboard } from "@/api/dashboard";
import { PageHeader, StatCard } from "@/components/admin/page-header";
import { Async } from "@/components/ui/async";
import { EmptyState, ProgressBar } from "@/components/ui/misc";
import { useProfile } from "@/hooks/use-auth";
import { usePageTitle } from "@/hooks/use-page-title";
import { statusColor, statusLabel } from "@/lib/orders";
import { fmtDateTime, peso } from "@/lib/utils";

export default function Dashboard() {
  usePageTitle("Dashboard", "Admin");
  const profile = useProfile();
  const denied = useSearchParams()[0].has("denied");
  const isAdmin = profile.role === "admin";
  const query = useQuery({ queryKey: ["dashboard", isAdmin], queryFn: () => fetchDashboard(isAdmin) });

  return (
    <>
      <PageHeader title="Dashboard" subtitle={`Welcome back, ${profile.full_name ?? profile.email}`} />
      {denied && <div role="alert" className="mb-4 rounded-xl bg-amber-100 p-3 text-sm text-amber-900">Your staff account does not have access to that page.</div>}
      <Async query={query} errorMessage="Could not load statistics. Make sure the SQL migrations have been applied, then refresh.">
        {({ stats, tracker }) => (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total products" value={stats.total_products} hint={`${stats.active_products} active`} />
              <StatCard label="Total orders" value={stats.total_orders} />
              <StatCard label="Pending" value={stats.pending} tone="orange" hint="Waiting for confirmation" />
              <StatCard label="Preparing" value={stats.preparing} tone="orange" />
              <StatCard label="Completed" value={stats.completed} tone="green" />
              <StatCard label="Cancelled" value={stats.cancelled} tone="red" />
              <StatCard label="Total sales" value={peso(stats.total_sales)} tone="green" hint="From completed orders only" />
              <StatCard label="Confirmed / Ready" value={`${stats.confirmed} / ${stats.ready}`} />
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <section className="card xl:col-span-2">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-bold">Recent orders</h2>
                  <Link to="/admin/orders" className="text-sm font-semibold text-navy underline">View all</Link>
                </div>
                {stats.recent_orders.length === 0 ? <EmptyState title="No orders yet">Orders placed on the website will appear here.</EmptyState> : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr><th className="th">Order</th><th className="th">Customer</th><th className="th">Total</th><th className="th">Status</th><th className="th">Placed</th></tr></thead>
                      <tbody className="divide-y divide-line">
                        {stats.recent_orders.map((o) => (
                          <tr key={o.id}>
                            <td className="td"><Link className="font-semibold text-navy underline" to={`/admin/orders/${o.id}`}>{o.order_number}</Link></td>
                            <td className="td">{o.customer_name}</td>
                            <td className="td">{peso(o.total)}</td>
                            <td className="td"><span className={`badge ${statusColor[o.status]}`}>{statusLabel(o.status)}</span></td>
                            <td className="td text-muted">{fmtDateTime(o.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <div className="space-y-6">
                <section className="card">
                  <h2 className="mb-3 text-lg font-bold">Popular products</h2>
                  {stats.popular_products.length === 0 ? <p className="text-sm text-muted">Not enough order data yet.</p> : (
                    <ol className="space-y-2 text-sm">
                      {stats.popular_products.map((p, i) => <li key={p.name} className="flex justify-between"><span>{i + 1}. {p.name}</span><strong>{p.quantity} sold</strong></li>)}
                    </ol>
                  )}
                </section>
                {tracker && (
                  <section className="card">
                    <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Project progress</h2><span className="text-2xl font-extrabold text-orange">{tracker.percent}%</span></div>
                    <ProgressBar value={tracker.percent} className="my-3" label="Overall project completion" />
                    <p className="text-sm text-muted">{tracker.completed} of {tracker.total} tasks completed{tracker.overdue > 0 && <> · <span className="font-semibold text-red-600">{tracker.overdue} overdue</span></>}</p>
                    <Link to="/admin/project-tracker" className="mt-3 inline-block text-sm font-semibold text-navy underline">Open tracker</Link>
                  </section>
                )}
              </div>
            </div>
          </div>
        )}
      </Async>
    </>
  );
}
