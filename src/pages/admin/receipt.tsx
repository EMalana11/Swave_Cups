import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";
import { fetchOrder } from "@/api/orders";
import { NotFound } from "@/components/layout/not-found";
import { Async } from "@/components/ui/async";
import { useSettings } from "@/hooks/queries";
import { usePageTitle } from "@/hooks/use-page-title";
import { fulfillmentLabel, paymentLabel, statusLabel } from "@/lib/orders";
import { fmtDateTime, isUuid, peso } from "@/lib/utils";

export default function ReceiptPage() {
  usePageTitle("Receipt", "Admin");
  const { id = "" } = useParams();
  const { settings: s } = useSettings();
  const query = useQuery({ queryKey: ["admin", "order", id], queryFn: () => fetchOrder(id), enabled: isUuid(id) });

  if (!isUuid(id)) return <NotFound />;
  return (
    <Async query={query}>
      {(data) => {
        if (!data) return <NotFound />;
        const { order, items } = data;
        return (
          <div className="mx-auto max-w-sm">
            <div className="mb-4 flex gap-2 print:hidden">
              <button type="button" className="btn btn-solid" onClick={() => window.print()}><Printer className="h-4 w-4" aria-hidden /> Print receipt</button>
            </div>
            <article className="rounded-lg bg-white p-6 font-mono text-sm shadow print:p-0 print:shadow-none">
              <header className="text-center">
                <h1 className="font-serif text-xl font-extrabold">{s.cafe_name}</h1>
                {s.address && <p className="text-xs">{s.address}</p>}
                {s.phone && <p className="text-xs">{s.phone}</p>}
              </header>
              <hr className="my-3 border-dashed border-black" />
              <p>Order: <strong>{order.order_number}</strong></p>
              <p>Date: {fmtDateTime(order.created_at)}</p>
              <p>Type: {fulfillmentLabel(order.fulfillment)}{order.table_number && ` (Table ${order.table_number})`}</p>
              <p>Customer: {order.customer_name} · {order.customer_phone}</p>
              {order.delivery_address && <p>Deliver to: {order.delivery_address}</p>}
              <hr className="my-3 border-dashed border-black" />
              <ul className="space-y-1">
                {items.map((i) => <li key={i.id} className="flex justify-between gap-2"><span>{i.quantity} × {i.product_name}</span><span>{peso(i.line_total)}</span></li>)}
              </ul>
              <hr className="my-3 border-dashed border-black" />
              <p className="flex justify-between"><span>Subtotal</span><span>{peso(order.subtotal)}</span></p>
              {order.delivery_fee > 0 && <p className="flex justify-between"><span>Delivery fee</span><span>{peso(order.delivery_fee)}</span></p>}
              <p className="flex justify-between text-base font-bold"><span>TOTAL</span><span>{peso(order.total)}</span></p>
              <p className="mt-2">Payment: Cash — {paymentLabel(order.payment_status)}</p>
              <p>Status: {statusLabel(order.status, order.fulfillment)}</p>
              <hr className="my-3 border-dashed border-black" />
              <p className="text-center text-xs">Thank you! Kape saglit, laban ulit. ☕</p>
            </article>
          </div>
        );
      }}
    </Async>
  );
}
