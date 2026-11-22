import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { deleteCategory, fetchAllCategories, fetchCategoryUsage, moveCategory, saveCategory } from "@/api/menu";
import { PageHeader } from "@/components/admin/page-header";
import { Async } from "@/components/ui/async";
import { ActionForm, ConfirmButton, Field, SubmitButton } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/misc";
import { usePageTitle } from "@/hooks/use-page-title";

export default function CategoriesPage() {
  usePageTitle("Categories", "Admin");
  const query = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const [categories, usage] = await Promise.all([fetchAllCategories(), fetchCategoryUsage()]);
      return { categories, usage };
    },
  });

  return (
    <>
      <PageHeader title="Categories" subtitle="Order here is the order of the tabs on the public menu." />
      <ActionForm action={saveCategory} resetOnSuccess className="card mb-6 grid items-start gap-3 sm:grid-cols-[1fr_2fr_auto]">
        <Field label="New category name *" name="name"><input id="name" name="name" required maxLength={80} className="input" /></Field>
        <Field label="Description" name="description"><input id="description" name="description" maxLength={300} className="input" /></Field>
        <input type="hidden" name="sort_order" value="999" /><input type="hidden" name="is_active" value="on" />
        <div className="sm:pt-6"><SubmitButton pendingText="Adding…">Add category</SubmitButton></div>
      </ActionForm>

      <Async query={query}>
        {({ categories, usage }) => categories.length === 0 ? <EmptyState title="No categories yet">Add your first category above.</EmptyState> : (
          <ul className="space-y-3">
            {categories.map((c, i) => {
              const used = usage.get(c.id) ?? 0;
              return (
                <li key={c.id} className="card">
                  <ActionForm action={saveCategory} className="grid items-start gap-3 md:grid-cols-[1fr_2fr_auto_auto]">
                    <input type="hidden" name="id" value={c.id} /><input type="hidden" name="sort_order" value={c.sort_order} />
                    <Field label="Name" name="name" id={`n-${c.id}`}><input id={`n-${c.id}`} name="name" defaultValue={c.name} required maxLength={80} className="input" /></Field>
                    <Field label="Description" name="description" id={`d-${c.id}`}><input id={`d-${c.id}`} name="description" defaultValue={c.description ?? ""} maxLength={300} className="input" /></Field>
                    <label className="flex items-center gap-2 text-sm md:pt-7"><input type="checkbox" name="is_active" defaultChecked={c.is_active} /> Active</label>
                    <div className="md:pt-6"><SubmitButton className="btn btn-line btn-sm" pendingText="Saving…">Save</SubmitButton></div>
                  </ActionForm>
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3 text-sm">
                    <span className="text-muted">{used} product(s)</span><span className="flex-1" />
                    {(["up", "down"] as const).map((dir) => (
                      <ActionForm key={dir} action={moveCategory} silent>
                        <input type="hidden" name="id" value={c.id} /><input type="hidden" name="dir" value={dir} />
                        <button className="btn btn-line btn-sm" disabled={dir === "up" ? i === 0 : i === categories.length - 1} aria-label={`Move ${c.name} ${dir}`}>
                          {dir === "up" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        </button>
                      </ActionForm>
                    ))}
                    <ActionForm action={deleteCategory}>
                      <input type="hidden" name="id" value={c.id} />
                      <ConfirmButton title={`Delete “${c.name}”?`} message={used > 0 ? "This category still has products, so it can't be deleted until they are moved or removed." : "This permanently deletes the category."}>
                        <Trash2 className="h-3 w-3" aria-hidden /> Delete
                      </ConfirmButton>
                    </ActionForm>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Async>
    </>
  );
}
