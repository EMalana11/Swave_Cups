import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { placeOrder } from "@/api/orders";
import { useCart } from "@/components/public/cart";
import { PageSkeleton } from "@/components/ui/skeletons";
import { useSettings } from "@/hooks/queries";
import { usePageTitle } from "@/hooks/use-page-title";
import { peso } from "@/lib/utils";

interface CheckoutSettings { ordersEnabled: boolean; dineIn: boolean; pickup: boolean; delivery: boolean; deliveryFee: number; minOrder: number; notice: string | null }
type Fulfillment = "dine_in" | "pickup" | "delivery";

export default function CheckoutPage() {
  usePageTitle("Checkout");
  const { settings, ready } = useSettings();
  if (!ready) return <PageSkeleton />;
  return <CheckoutForm s={{
    ordersEnabled: settings.orders_enabled, dineIn: settings.dine_in_enabled, pickup: settings.pickup_enabled, delivery: settings.delivery_enabled,
    deliveryFee: Number(settings.delivery_fee), minOrder: Number(settings.min_order_amount), notice: settings.order_notice,
  }} />;
}

function CheckoutForm({ s }: { s: CheckoutSettings }) {
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const options = ([["dine_in", "Dine-in", s.dineIn], ["pickup", "Pickup", s.pickup], ["delivery", "Delivery", s.delivery]] as [Fulfillment, string, boolean][]).filter((o) => o[2]);
  const [type, setType] = useState<Fulfillment>(options[0]?.[0] ?? "pickup");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  if (!s.ordersEnabled || options.length === 0)
    return <div className="mx-auto max-w-xl px-4 py-16 text-center"><h1 className="text-2xl font-bold">Online ordering is paused</h1><p className="mt-2 text-muted">Please check back soon or visit us in person.</p><Link to="/" className="btn btn-solid mt-6">Back home</Link></div>;
  if (items.length === 0)
    return <div className="mx-auto max-w-xl px-4 py-16 text-center"><h1 className="text-2xl font-bold">Your cart is empty</h1><Link to="/menu" className="btn btn-solid mt-6">Browse the menu</Link></div>;

  const fee = type === "delivery" ? s.deliveryFee : 0;
  const below = subtotal < s.minOrder;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const value = (key: string) => String(fd.get(key) ?? "");

    setPending(true);
    const result = await placeOrder({
      customer_name: value("customer_name"), customer_phone: value("customer_phone"), customer_email: value("customer_email"),
      fulfillment: type, table_number: value("table_number"), requested_time: value("requested_time"), delivery_address: value("delivery_address"),
      notes: value("notes"), website: value("website"), items: items.map((i) => ({ product_id: i.id, quantity: i.qty })),
    });
    setPending(false);

    if (!result.ok) {
      setErrors(result.errors ?? {});
      toast.error(result.message);
      return;
    }
    clear();
    navigate(`/order-success?n=${encodeURIComponent(result.orderNumber)}`);
  }
  const err = (k: string) => errors[k] && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{errors[k]}</p>;

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-[1fr_20rem]">
      <form onSubmit={submit} className="card space-y-4" noValidate>
        <h1 className="text-3xl font-extrabold text-navy">Checkout</h1>
        <fieldset>
          <legend className="label">How would you like your order?</legend>
          <div className="flex flex-wrap gap-2">
            {options.map(([v, label]) => (
              <label key={v} className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm font-medium ${type === v ? "border-navy bg-navy text-white" : "border-line bg-white"}`}>
                <input type="radio" name="fulfillment" value={v} checked={type === v} onChange={() => setType(v)} className="sr-only" />{label}</label>))}
          </div>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="customer_name">Your name *</label><input id="customer_name" name="customer_name" className="input" required maxLength={100} autoComplete="name" />{err("customer_name")}</div>
          <div><label className="label" htmlFor="customer_phone">Phone number *</label><input id="customer_phone" name="customer_phone" type="tel" className="input" required maxLength={30} autoComplete="tel" placeholder="09XX XXX XXXX" />{err("customer_phone")}</div>
        </div>
        <div><label className="label" htmlFor="customer_email">Email (optional)</label><input id="customer_email" name="customer_email" type="email" className="input" maxLength={150} autoComplete="email" />{err("customer_email")}</div>
        {type === "dine_in" && <div><label className="label" htmlFor="table_number">Table number (optional)</label><input id="table_number" name="table_number" className="input" maxLength={20} /></div>}
        {type !== "dine_in" && <div><label className="label" htmlFor="requested_time">{type === "pickup" ? "Preferred pickup time" : "Preferred delivery time"} (optional)</label><input id="requested_time" name="requested_time" className="input" maxLength={40} placeholder="e.g. 3:30 PM, or ASAP" /></div>}
        {type === "delivery" && <div><label className="label" htmlFor="delivery_address">Delivery address *</label><textarea id="delivery_address" name="delivery_address" className="input" rows={2} maxLength={300} required />{err("delivery_address")}</div>}
        <div><label className="label" htmlFor="notes">Notes for the cafe (optional)</label><textarea id="notes" name="notes" className="input" rows={2} maxLength={500} placeholder="Less ice, no sugar, allergies…" /></div>
        <div className="hidden" aria-hidden><label>Leave empty<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
        <div className="rounded-xl bg-butter/50 p-4 text-sm">
          <p className="font-semibold">Payment: cash only</p>
          <p>{type === "dine_in" ? "Pay at the counter." : type === "pickup" ? "Pay when you pick up." : "Pay the rider when it arrives."} No online payment is taken on this website, and nothing is charged now.</p>
          {s.notice && <p className="mt-1 text-muted">{s.notice}</p>}
        </div>
        {below && <p role="alert" className="text-sm font-medium text-red-600">Minimum order is {peso(s.minOrder)}. Add {peso(s.minOrder - subtotal)} more.</p>}
        <button className="btn btn-orange w-full py-3" disabled={pending || below}>{pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}{pending ? "Placing order…" : "Place order"}</button>
      </form>
      <aside className="card h-fit">
        <h2 className="text-lg font-bold">Order summary</h2>
        <ul className="mt-3 divide-y divide-line text-sm">{items.map((i) => <li key={i.id} className="flex justify-between gap-3 py-2"><span>{i.qty} × {i.name}</span><span>{peso(i.price * i.qty)}</span></li>)}</ul>
        <dl className="mt-3 space-y-1 text-sm"><div className="flex justify-between"><dt>Subtotal</dt><dd>{peso(subtotal)}</dd></div>
          {fee > 0 && <div className="flex justify-between"><dt>Delivery fee</dt><dd>{peso(fee)}</dd></div>}
          <div className="flex justify-between border-t border-line pt-2 text-base font-bold"><dt>Total</dt><dd>{peso(subtotal + fee)}</dd></div></dl>
        <p className="mt-2 text-xs text-muted">Final prices are confirmed by the cafe&apos;s system when you place the order.</p>
        <Link to="/cart" className="mt-3 inline-block text-sm text-navy underline">Edit cart</Link>
      </aside>
    </div>
  );
}
