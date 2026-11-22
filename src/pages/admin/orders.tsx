import { Link, useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchOrders } from "@/api/orders";
import { FilterForm } from "@/components/admin/filter-form";
import { PageHeader } from "@/components/admin/page-header";
import { Async } from "@/components/ui/async";
import { EmptyState, Pagination } from "@/components/ui/misc";
import { usePageTitle } from "@/hooks/use-page-title";
import { ORDER_STATUSES, fulfillmentLabel, paymentLabel, statusColor, statusLabel } from "@/lib/orders";
import { PAGE_SIZE, pageRange, parsePage, safeSearch } from "@/lib/paging";
import { fmtDateTime, peso } from "@/lib/utils";

export default function OrdersPage() {
  usePageTitle("Orders", "Admin");
  const [params] = useSearchParams();
  const q = safeSearch(params.get("q"));
  const status = params.get("status") ?? undefined;
  const type = params.get("type") ?? undefined;
  const page = parsePage(params.get("page"));

  const query = useQuery({
    queryKey: ["admin", "orders", { q, status, type, page }],
    queryFn: () => fetchOrders({ q, status, type, ...pageRange(page) }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader title="Orders" subtitle="Orders placed through the website" />
      <FilterForm className="card mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1"><label className="label" htmlFor="q">Search</label><input id="q" name="q" defaultValue={q} className="input" placeholder="Order number, name or phone" /></div>
        <div><label className="label" htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={status ?? ""} className="input"><option value="">All</option>{ORDER_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}</select></div>
        <div><label className="label" htmlFor="type">Type</label>
          <select id="type" name="type" defaultValue={type ?? ""} className="input"><option value="">All</option><option value="dine_in">Dine-in</option><option value="pickup">Pickup</option><option value="delivery">Delivery</option></select></div>
        <button className="btn btn-solid">Filter</button>
      </FilterForm>

      <Async query={query} errorMessage="Could not load orders. Please refresh.">
        {({ orders, count }) => (
          <>
            {orders.length === 0 ? <EmptyState title="No orders found">Orders from the website will show up here.</EmptyState> : (
              <div className="card overflow-x-auto p-0">
                <table className="w-full min-w-[44rem]">
                  <thead className="border-b border-line"><tr><th className="th">Order</th><th className="th">Customer</th><th className="th">Type</th><th className="th">Total</th><th className="th">Payment</th><th className="th">Status</th><th className="th">Placed</th></tr></thead>
                  <tbody className="divide-y divide-line">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-cream/60">
                        <td className="td"><Link className="font-semibold text-navy underline" to={`/admin/orders/${o.id}`}>{o.order_number}</Link></td>
                        <td className="td">{o.customer_name}<span className="block text-xs text-muted">{o.customer_phone}</span></td>
                        <td className="td">{fulfillmentLabel(o.fulfillment)}</td>
                        <td className="td">{peso(o.total)}</td>
                        <td className="td">{paymentLabel(o.payment_status)}</td>
                        <td className="td"><span className={`badge ${statusColor[o.status]}`}>{statusLabel(o.status, o.fulfillment)}</span></td>
                        <td className="td text-muted">{fmtDateTime(o.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination page={page} pages={Math.ceil(count / PAGE_SIZE)} basePath="/admin/orders" params={{ q, status, type }} />
          </>
        )}
      </Async>
    </>
  );
}
