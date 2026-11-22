import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";
import { fetchOrder, saveOrderNotes, updateOrderStatus, updatePayment } from "@/api/orders";
import { PageHeader } from "@/components/admin/page-header";
import { NotFound } from "@/components/layout/not-found";
import { Async } from "@/components/ui/async";
import { ActionForm, ConfirmButton, Field, SubmitButton } from "@/components/ui/form";
import { usePageTitle } from "@/hooks/use-page-title";
import { NEXT_STATUS, fulfillmentLabel, statusColor, statusLabel } from "@/lib/orders";
import { fmtDateTime, isUuid, peso } from "@/lib/utils";

export default function OrderDetailPage() {
  usePageTitle("Order details", "Admin");
  const { id = "" } = useParams();
  const query = useQuery({ queryKey: ["admin", "order", id], queryFn: () => fetchOrder(id), enabled: isUuid(id) });

  if (!isUuid(id)) return <NotFound />;
  return (
    <Async query={query}>
      {(data) => {
        if (!data) return <NotFound />;
        const { order, items, events } = data;
        const next = NEXT_STATUS[order.status];
        return (
          <>
            <PageHeader title={`Order ${order.order_number}`} subtitle={`Placed ${fmtDateTime(order.created_at)}`}>
              <Link to="/admin/orders" className="btn btn-line">← All orders</Link>
              <Link to={`/admin/orders/${id}/receipt`} className="btn btn-solid"><Printer className="h-4 w-4" aria-hidden /> Receipt</Link>
            </PageHeader>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <section className="card">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-bold">Items</h2><span className={`badge ${statusColor[order.status]}`}>{statusLabel(order.status, order.fulfillment)}</span></div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr><th className="th">Item</th><th className="th">Qty</th><th className="th text-right">Unit price</th><th className="th text-right">Line total</th></tr></thead>
                      <tbody className="divide-y divide-line">
                        {items.map((i) => <tr key={i.id}><td className="td">{i.product_name}</td><td className="td">{i.quantity}</td><td className="td text-right">{peso(i.unit_price)}</td><td className="td text-right">{peso(i.line_total)}</td></tr>)}
                      </tbody>
                    </table>
                  </div>
                  <dl className="ml-auto mt-4 max-w-xs space-y-1 text-sm">
                    <div className="flex justify-between"><dt>Subtotal</dt><dd>{peso(order.subtotal)}</dd></div>
                    {order.delivery_fee > 0 && <div className="flex justify-between"><dt>Delivery fee</dt><dd>{peso(order.delivery_fee)}</dd></div>}
                    <div className="flex justify-between border-t border-line pt-1 text-base font-bold"><dt>Total</dt><dd>{peso(order.total)}</dd></div>
                  </dl>
                </section>
                <section className="card">
                  <h2 className="mb-3 text-lg font-bold">History</h2>
                  <ol className="space-y-2 text-sm">
                    {events.map((e) => (
                      <li key={e.id} className="flex justify-between gap-3">
                        <span>{e.from_status ? `${statusLabel(e.from_status)} → ` : "Placed as "}<strong>{statusLabel(e.to_status)}</strong></span>
                        <span className="text-muted">{fmtDateTime(e.created_at)}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              </div>

              <div className="space-y-6">
                <section className="card text-sm">
                  <h2 className="mb-3 text-lg font-bold">Customer</h2>
                  <p className="font-semibold">{order.customer_name}</p>
                  {order.customer_id ? <Link className="text-navy underline" to={`/admin/customers/${order.customer_id}`}>{order.customer_phone}</Link> : <p>{order.customer_phone}</p>}
                  {order.customer_email && <p>{order.customer_email}</p>}
                  <hr className="my-3 border-line" />
                  <p><strong>{fulfillmentLabel(order.fulfillment)}</strong>{order.table_number && ` · Table ${order.table_number}`}</p>
                  {order.requested_time && <p>Requested time: {order.requested_time}</p>}
                  {order.delivery_address && <p className="whitespace-pre-line">{order.delivery_address}</p>}
                  {order.notes && <p className="mt-2 rounded-lg bg-butter/50 p-2"><strong>Customer note:</strong> {order.notes}</p>}
                </section>

                <section className="card">
                  <h2 className="mb-3 text-lg font-bold">Update status</h2>
                  {next.length === 0 ? <p className="text-sm text-muted">This order is {statusLabel(order.status).toLowerCase()} and can no longer be changed.</p> : (
                    <div className="flex flex-wrap gap-2">
                      {next.map((s) => (
                        <ActionForm key={s} action={updateOrderStatus}>
                          <input type="hidden" name="id" value={id} /><input type="hidden" name="to" value={s} />
                          {s === "cancelled"
                            ? <ConfirmButton title="Cancel this order?" message="Cancelled orders cannot be reopened." confirmLabel="Cancel order" className="btn btn-line btn-sm text-red-700">Cancel order</ConfirmButton>
                            : <SubmitButton className="btn btn-solid btn-sm">Mark {statusLabel(s, order.fulfillment).toLowerCase()}</SubmitButton>}
                        </ActionForm>
                      ))}
                    </div>
                  )}
                </section>

                <section className="card">
                  <h2 className="mb-1 text-lg font-bold">Payment</h2>
                  <p className="mb-3 text-sm text-muted">Cash only. Nothing is paid online; mark it paid after you receive the cash.</p>
                  <div className="flex flex-wrap gap-2">
                    {(["unpaid", "paid", "refunded"] as const).map((p) => (
                      <ActionForm key={p} action={updatePayment}>
                        <input type="hidden" name="id" value={id} /><input type="hidden" name="to" value={p} />
                        <SubmitButton className={`btn btn-sm ${order.payment_status === p ? "btn-orange" : "btn-line"}`}>{p[0].toUpperCase() + p.slice(1)}</SubmitButton>
                      </ActionForm>
                    ))}
                  </div>
                </section>

                <section className="card">
                  <ActionForm action={saveOrderNotes} className="space-y-2">
                    <input type="hidden" name="id" value={id} />
                    <Field label="Internal notes" name="admin_notes"><textarea id="admin_notes" name="admin_notes" rows={3} maxLength={1000} defaultValue={order.admin_notes ?? ""} className="input" /></Field>
                    <SubmitButton className="btn btn-line btn-sm">Save notes</SubmitButton>
                  </ActionForm>
                </section>
              </div>
            </div>
          </>
        );
      }}
    </Async>
  );
}
