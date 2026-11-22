import { Link, useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchCustomers } from "@/api/customers";
import { FilterForm } from "@/components/admin/filter-form";
import { PageHeader } from "@/components/admin/page-header";
import { Async } from "@/components/ui/async";
import { EmptyState, Pagination } from "@/components/ui/misc";
import { usePageTitle } from "@/hooks/use-page-title";
import { PAGE_SIZE, pageRange, parsePage, safeSearch } from "@/lib/paging";
import { fmtDate, peso } from "@/lib/utils";

export default function CustomersPage() {
  usePageTitle("Customers", "Admin");
  const [params] = useSearchParams();
  const q = safeSearch(params.get("q"));
  const page = parsePage(params.get("page"));

  const query = useQuery({
    queryKey: ["admin", "customers", { q, page }],
    queryFn: () => fetchCustomers({ q, ...pageRange(page) }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader title="Customers" subtitle="Built from orders placed on the website. Contains personal data — handle with care." />
      <FilterForm className="card mb-4 flex items-end gap-3">
        <div className="flex-1"><label className="label" htmlFor="q">Search</label><input id="q" name="q" defaultValue={q} className="input" placeholder="Name, phone or email" /></div>
        <button className="btn btn-solid">Search</button>
      </FilterForm>

      <Async query={query} errorMessage="Could not load customers.">
        {({ customers, stats, count }) => (
          <>
            {customers.length === 0 ? <EmptyState title="No customers yet">Customers appear automatically after their first order.</EmptyState> : (
              <div className="card overflow-x-auto p-0">
                <table className="w-full min-w-[40rem]">
                  <thead className="border-b border-line"><tr><th className="th">Name</th><th className="th">Phone</th><th className="th">Orders</th><th className="th">Total spent</th><th className="th">First order</th></tr></thead>
                  <tbody className="divide-y divide-line">
                    {customers.map((c) => {
                      const s = stats.get(c.id);
                      return (
                        <tr key={c.id}>
                          <td className="td"><Link className="font-semibold text-navy underline" to={`/admin/customers/${c.id}`}>{c.full_name}</Link></td>
                          <td className="td">{c.phone}</td>
                          <td className="td">{s?.orders ?? 0}</td>
                          <td className="td">{peso(s?.spent ?? 0)}</td>
                          <td className="td text-muted">{fmtDate(c.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination page={page} pages={Math.ceil(count / PAGE_SIZE)} basePath="/admin/customers" params={{ q }} />
          </>
        )}
      </Async>
    </>
  );
}
