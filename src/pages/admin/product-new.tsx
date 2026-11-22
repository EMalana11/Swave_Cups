import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchAllCategories } from "@/api/menu";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { Async } from "@/components/ui/async";
import { EmptyState } from "@/components/ui/misc";
import { usePageTitle } from "@/hooks/use-page-title";

export default function NewProductPage() {
  usePageTitle("New product", "Admin");
  const query = useQuery({ queryKey: ["admin", "categories"], queryFn: fetchAllCategories });
  return (
    <>
      <PageHeader title="New product" />
      <Async query={query}>
        {(categories) => categories.length === 0
          ? <EmptyState title="Create a category first">Products must belong to a category. <Link to="/admin/categories" className="underline">Go to categories</Link>.</EmptyState>
          : <ProductForm categories={categories} />}
      </Async>
    </>
  );
}
