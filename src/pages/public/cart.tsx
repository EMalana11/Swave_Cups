import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/public/cart";
import { ProductImage } from "@/components/public/product-ui";
import { CashOnlyNotice } from "@/components/public/cash-notice";
import { EmptyState } from "@/components/ui/misc";
import { usePageTitle } from "@/hooks/use-page-title";
import { peso } from "@/lib/utils";

export default function CartPage() {
  usePageTitle("Your cart");
  const { items, subtotal, setQty, remove, clear } = useCart();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-navy">Your cart</h1>
      {items.length === 0 ? (
        <div className="mt-6"><EmptyState title="Your cart is empty" icon={<ShoppingBag className="h-8 w-8" />}>Add something tasty from the menu.</EmptyState>
          <div className="mt-4 text-center"><Link to="/menu" className="btn btn-solid">Browse the menu</Link></div></div>
      ) : (
        <>
          <ul className="mt-6 space-y-3">
            {items.map((i) => (
              <li key={i.id} className="card flex items-center gap-4 p-3">
                <ProductImage src={i.image} alt={i.name} className="h-20 w-20 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{i.name}</p>
                  <p className="text-sm text-muted">{peso(i.price)} each</p>
                  <div className="mt-2 flex items-center gap-2" role="group" aria-label={`Quantity of ${i.name}`}>
                    <button className="btn btn-line btn-sm" aria-label="Decrease quantity" onClick={() => setQty(i.id, i.qty - 1)}><Minus className="h-3 w-3" /></button>
                    <span className="w-8 text-center font-semibold" aria-live="polite">{i.qty}</span>
                    <button className="btn btn-line btn-sm" aria-label="Increase quantity" onClick={() => setQty(i.id, i.qty + 1)} disabled={i.qty >= 99}><Plus className="h-3 w-3" /></button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-navy">{peso(i.price * i.qty)}</p>
                  <button className="mt-2 text-xs text-red-600 hover:underline" onClick={() => remove(i.id)}><Trash2 className="mr-1 inline h-3 w-3" aria-hidden />Remove</button>
                </div>
              </li>
            ))}
          </ul>
          <CashOnlyNotice compact className="mt-6" />
          <div className="card mt-4">
            <div className="flex justify-between text-lg"><span>Subtotal</span><strong>{peso(subtotal)}</strong></div>
            <p className="mt-1 text-xs text-muted">Prices are double-checked against the current menu when you place your order.</p>
            <div className="mt-4 flex flex-wrap justify-between gap-3">
              <button className="btn btn-ghost btn-sm" onClick={clear}>Clear cart</button>
              <Link to="/checkout" className="btn btn-orange">Continue to checkout</Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
