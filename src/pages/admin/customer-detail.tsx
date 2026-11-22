import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCustomer } from "@/api/customers";
import { PageHeader, StatCard } from "@/components/admin/page-header";
import { NotFound } from "@/components/layout/not-found";
import { Async } from "@/components/ui/async";
import { EmptyState } from "@/components/ui/misc";
import { usePageTitle } from "@/hooks/use-page-title";
import { statusColor, statusLabel } from "@/lib/orders";
import { fmtDate, fmtDateTime, isUuid, peso } from "@/lib/utils";

export default function CustomerDetailPage() {
  usePageTitle("Customer", "Admin");
  const { id = "" } = useParams();
  const query = useQuery({ queryKey: ["admin", "customer", id], queryFn: () => fetchCustomer(id), enabled: isUuid(id) });

  if (!isUuid(id)) return <NotFound />;
  return (
    <Async query={query}>
      {(data) => {
        if (!data) return <NotFound />;
        const { customer, orders } = data;
        const completed = orders.filter((o) => o.status === "completed");
        const spent = completed.reduce((sum, o) => sum + Number(o.total), 0);
        return (
          <>
            <PageHeader title={customer.full_name} subtitle={`${customer.phone}${customer.email ? " · " + customer.email : ""} · Customer since ${fmtDate(customer.created_at)}`}>
              <Link to="/admin/customers" className="btn btn-line">← All customers</Link>
            </PageHeader>
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <StatCard label="Orders" value={orders.length} />
              <StatCard label="Completed" value={completed.length} tone="green" />
              <StatCard label="Total spent" value={peso(spent)} tone="green" hint="Completed orders only" />
            </div>
            {orders.length === 0 ? <EmptyState title="No orders" /> : (
              <div className="card overflow-x-auto p-0">
                <table className="w-full">
                  <thead className="border-b border-line"><tr><th className="th">Order</th><th className="th">Total</th><th className="th">Status</th><th className="th">Placed</th></tr></thead>
                  <tbody className="divide-y divide-line">
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td className="td"><Link className="font-semibold text-navy underline" to={`/admin/orders/${o.id}`}>{o.order_number}</Link></td>
                        <td className="td">{peso(o.total)}</td>
                        <td className="td"><span className={`badge ${statusColor[o.status]}`}>{statusLabel(o.status, o.fulfillment)}</span></td>
                        <td className="td text-muted">{fmtDateTime(o.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        );
      }}
    </Async>
  );
}
