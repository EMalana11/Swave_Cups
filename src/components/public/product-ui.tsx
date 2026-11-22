import { useState } from "react";
import { Coffee, Cookie, Leaf, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "./cart";
import { cn } from "@/lib/utils";
import type { MenuKind } from "@/lib/menu-kind";
import type { Product } from "@/lib/types";

// Written out in full so Tailwind can see every class.
const THEME = {
  matcha: { bg: "bg-gradient-to-br from-lime-100 via-emerald-100 to-emerald-200 text-emerald-900", Icon: Leaf },
  coffee: { bg: "bg-gradient-to-br from-amber-100 via-orange-100 to-amber-200 text-amber-900", Icon: Coffee },
  bites: { bg: "bg-gradient-to-br from-butter/70 via-yellow-100 to-orange-100 text-rust", Icon: Cookie },
  other: { bg: "bg-gradient-to-br from-butter/50 to-cream text-navy", Icon: Coffee },
} as const;

/** Shows the product photo; if there isn't one (or it fails to load) a themed placeholder keeps the card looking intentional. */
export function ProductImage({ src, alt, className, kind = "other" }: { src: string | null; alt: string; className?: string; kind?: MenuKind }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    const { bg, Icon } = THEME[kind];
    return (
      <div role="img" aria-label={`${alt} — photo coming soon`} className={cn("flex flex-col items-center justify-center gap-1", bg, className)}>
        <Icon className="h-10 w-10" aria-hidden />
        <span aria-hidden className="font-hand text-lg leading-none opacity-80">photo coming soon</span>
      </div>
    );
  }
    return <img src={src} alt={alt} loading="lazy" onError={() => setBroken(true)} className={cn("object-cover", className)} />;
}

export function AddToCartButton({ product, ordersEnabled = true, className = "btn btn-orange btn-sm" }: { product: Product; ordersEnabled?: boolean; className?: string }) {
  const { add } = useCart();
  if (!ordersEnabled) return <button className={className} disabled>Ordering paused</button>;
  return (
    <button className={className} onClick={() => { add({ id: product.id, name: product.name, price: product.price, image: product.image_url }); toast.success(`${product.name} added to cart`); }}>
      <ShoppingBag className="h-4 w-4" aria-hidden /> Add to cart
    </button>
  );
}
