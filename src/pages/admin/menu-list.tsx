import { Link, useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteProduct, fetchAllCategories, fetchProducts, toggleProduct } from "@/api/menu";
import { FilterForm } from "@/components/admin/filter-form";
import { PageHeader } from "@/components/admin/page-header";
import { ProductImage } from "@/components/public/product-ui";
import { Async } from "@/components/ui/async";
import { ActionForm, ConfirmButton } from "@/components/ui/form";
import { EmptyState, Pagination } from "@/components/ui/misc";
import { usePageTitle } from "@/hooks/use-page-title";
import { PAGE_SIZE, pageRange, parsePage, safeSearch } from "@/lib/paging";
import { peso } from "@/lib/utils";

export default function MenuAdminPage() {
  usePageTitle("Menu", "Admin");
  const [params] = useSearchParams();
  const q = safeSearch(params.get("q"));
  const category = params.get("category") ?? undefined;
  const status = params.get("status") ?? undefined;
  const page = parsePage(params.get("page"));

  const categories = useQuery({ queryKey: ["admin", "categories"], queryFn: fetchAllCategories });
  const products = useQuery({
    queryKey: ["admin", "products", { q, category, status, page }],
    queryFn: () => fetchProducts({ q, category, status, ...pageRange(page) }),
    placeholderData: keepPreviousData,
  });
  const categoryList = categories.data ?? [];

  return (
    <>
      <PageHeader title="Menu" subtitle="Changes appear on the public menu immediately.">
        <Link to="/admin/menu/new" className="btn btn-orange"><Plus className="h-4 w-4" aria-hidden /> Add product</Link>
      </PageHeader>

      <FilterForm className="card mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1"><label className="label" htmlFor="q">Search</label><input id="q" name="q" defaultValue={q} className="input" placeholder="Name or description" /></div>
        <div><label className="label" htmlFor="category">Category</label>
          <select id="category" name="category" defaultValue={category ?? ""} className="input"><option value="">All</option>{categoryList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div><label className="label" htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={status ?? ""} className="input"><option value="">All</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
        <button className="btn btn-solid">Filter</button>
      </FilterForm>

      <Async query={products} errorMessage="Could not load products. Please refresh.">
        {({ products: rows, count }) => (
          <>
            {rows.length === 0 ? (
              <EmptyState title="No products found">
                {categoryList.length === 0 ? <>Create a <Link className="underline" to="/admin/categories">category</Link> first, then add products.</> : "Try different filters or add your first product."}
              </EmptyState>
            ) : (
              <div className="card overflow-x-auto p-0">
                <table className="w-full min-w-[40rem]">
                  <thead className="border-b border-line"><tr><th className="th">Product</th><th className="th">Category</th><th className="th">Price</th><th className="th">Status</th><th className="th text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-line">
                    {rows.map((p) => (
                      <tr key={p.id}>
                        <td className="td">
                          <div className="flex items-center gap-3">
                            <ProductImage src={p.image_url} alt="" className="h-12 w-12 rounded-lg" />
                            <div><p className="font-semibold">{p.name}</p>{p.is_featured && <span className="badge bg-butter text-navy-deep">Featured</span>}</div>
                          </div>
                        </td>
                        <td className="td">{p.categories?.name}</td>
                        <td className="td">{peso(p.price)}</td>
                        <td className="td">
                          <ActionForm action={toggleProduct} silent>
                            <input type="hidden" name="id" value={p.id} /><input type="hidden" name="to" value={String(!p.is_active)} />
                            <button className={`badge cursor-pointer ${p.is_active ? "bg-green-100 text-green-800" : "bg-stone-200 text-stone-700"}`} title="Click to toggle" aria-label={`${p.name} is ${p.is_active ? "active" : "inactive"}. Toggle.`}>{p.is_active ? "Active" : "Inactive"}</button>
                          </ActionForm>
                        </td>
                        <td className="td">
                          <div className="flex justify-end gap-2">
                            <Link to={`/admin/menu/${p.id}`} className="btn btn-line btn-sm"><Pencil className="h-3 w-3" aria-hidden /> Edit</Link>
                            <ActionForm action={deleteProduct}>
                              <input type="hidden" name="id" value={p.id} />
                              <ConfirmButton title={`Delete “${p.name}”?`} message="This removes it from the menu permanently. Past orders keep their original name and price."><Trash2 className="h-3 w-3" aria-hidden /> Delete</ConfirmButton>
                            </ActionForm>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination page={page} pages={Math.ceil(count / PAGE_SIZE)} basePath="/admin/menu" params={{ q, category, status }} />
          </>
        )}
      </Async>
    </>
  );
}
