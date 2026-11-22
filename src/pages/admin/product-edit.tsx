import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchAllCategories, fetchProduct } from "@/api/menu";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { NotFound } from "@/components/layout/not-found";
import { Async } from "@/components/ui/async";
import { usePageTitle } from "@/hooks/use-page-title";
import { isUuid } from "@/lib/utils";

export default function EditProductPage() {
  const { id = "" } = useParams();
  const query = useQuery({
    queryKey: ["admin", "product", id],
    queryFn: async () => {
      const [product, categories] = await Promise.all([fetchProduct(id), fetchAllCategories()]);
      return { product, categories };
    },
    enabled: isUuid(id),
  });
  usePageTitle(query.data?.product ? `Edit ${query.data.product.name}` : "Edit product", "Admin");

  if (!isUuid(id)) return <NotFound />;
  return (
    <Async query={query}>
      {({ product, categories }) => !product ? <NotFound /> : (
        <>
          <PageHeader title={`Edit ${product.name}`} />
          <ProductForm product={product} categories={categories} />
        </>
      )}
    </Async>
  );
}
