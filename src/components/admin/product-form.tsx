import { Link } from "react-router-dom";
import { ActionForm, Field, SubmitButton } from "@/components/ui/form";
import { ImageInput } from "./image-input";
import { saveProduct } from "@/api/menu";
import type { Category, Product } from "@/lib/types";

export function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  return (
    <ActionForm action={saveProduct} redirectTo="/admin/menu" className="card max-w-3xl space-y-5">
      {product && <input type="hidden" name="id" value={product.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name *" name="name"><input id="name" name="name" className="input" required maxLength={120} defaultValue={product?.name} /></Field>
        <Field label="Category *" name="category_id">
          <select id="category_id" name="category_id" className="input" required defaultValue={product?.category_id ?? ""}>
            <option value="" disabled>Choose a category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}{c.is_active ? "" : " (inactive)"}</option>)}
          </select>
        </Field>
        <Field label="Price (PHP) *" name="price"><input id="price" name="price" type="number" step="0.01" min="0" max="100000" required className="input" defaultValue={product?.price} /></Field>
        <Field label="Short description" name="short_description" hint="Shown on the menu card."><input id="short_description" name="short_description" className="input" maxLength={200} defaultValue={product?.short_description ?? ""} /></Field>
      </div>
      <Field label="Full description" name="description"><textarea id="description" name="description" rows={4} maxLength={2000} className="input" defaultValue={product?.description ?? ""} /></Field>
      <div><span className="label">Photo</span><ImageInput current={product?.image_url} removable /></div>
      <div className="flex flex-wrap gap-6 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" name="is_active" defaultChecked={product?.is_active ?? true} /> Active (visible on the menu)</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="is_featured" defaultChecked={product?.is_featured ?? false} /> Featured favorite</label>
      </div>
      <div className="flex gap-3"><SubmitButton pendingText="Saving…">{product ? "Save changes" : "Create product"}</SubmitButton><Link to="/admin/menu" className="btn btn-line">Cancel</Link></div>
    </ActionForm>
  );
}
