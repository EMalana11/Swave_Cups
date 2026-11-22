import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { fetchProductBySlug } from "@/api/menu";
import { AddToCartButton, ProductImage } from "@/components/public/product-ui";
import { NotFound } from "@/components/layout/not-found";
import { Async } from "@/components/ui/async";
import { PageSkeleton } from "@/components/ui/skeletons";
import { useSettings } from "@/hooks/queries";
import { usePageTitle } from "@/hooks/use-page-title";
import { kindOf } from "@/lib/menu-kind";
import { peso } from "@/lib/utils";

export default function ProductPage() {
  const { slug = "" } = useParams();
  const query = useQuery({ queryKey: ["product", slug], queryFn: () => fetchProductBySlug(slug) });
  const { settings } = useSettings();
  usePageTitle(query.data?.name);

  return (
    <Async query={query} skeleton={<PageSkeleton />}>
      {(p) => !p ? <NotFound /> : (
        <div className="mx-auto max-w-4xl px-4 py-10">
          <Link to="/menu" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-navy hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden /> Back to menu</Link>
          <div className="grid gap-8 md:grid-cols-2">
            <ProductImage src={p.image_url} alt={p.name} kind={kindOf(p)} className="aspect-square w-full rounded-2xl shadow" />
            <div>
              {p.categories?.name && <span className="badge bg-navy/10 text-navy">{p.categories.name}</span>}
              <h1 className="mt-2 text-3xl font-extrabold text-navy">{p.name}</h1>
              <p className="mt-2 text-2xl font-bold text-orange">{peso(p.price)}</p>
              <p className="mt-4 whitespace-pre-line text-muted">{p.description || p.short_description || "Made with love at Swave Cups."}</p>
              <div className="mt-6"><AddToCartButton product={p} ordersEnabled={settings.orders_enabled} className="btn btn-orange" /></div>
            </div>
          </div>
        </div>
      )}
    </Async>
  );
}
