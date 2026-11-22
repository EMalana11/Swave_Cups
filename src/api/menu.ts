import { categorySchema, fieldErrors, idSchema, productSchema } from "@/lib/validation";
import { supabase, unwrap } from "@/lib/supabase";
import { dbMessage, done, fail, slugify } from "@/lib/utils";
import { removeImage, uploadImage } from "./storage";
import type { ActionState, Category, Product } from "@/lib/types";

const asProduct = (row: unknown): Product => ({ ...(row as Product), price: Number((row as Product).price) });

/* ---------- public reads ---------- */

export async function fetchMenu() {
  const [categories, products] = await Promise.all([
    supabase.from("categories").select("id,name,description,sort_order,is_active").eq("is_active", true).order("sort_order").order("name"),
    supabase.from("products").select("*, categories(name)").eq("is_active", true).order("is_featured", { ascending: false }).order("name"),
  ]);
  return {
    categories: unwrap(categories) as Category[],
    products: (unwrap(products) as unknown[]).map(asProduct),
  };
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const row = unwrap(await supabase.from("products").select("*, categories(name)").eq("slug", slug).eq("is_active", true).maybeSingle());
  return row ? asProduct(row) : null;
}

/* ---------- admin reads ---------- */

export async function fetchAllCategories(): Promise<Category[]> {
  return unwrap(await supabase.from("categories").select("*").order("sort_order").order("name"));
}

/** Number of products in each category, keyed by category id. */
export async function fetchCategoryUsage(): Promise<Map<string, number>> {
  const rows = unwrap(await supabase.from("products").select("category_id")) as { category_id: string }[];
  const usage = new Map<string, number>();
  for (const r of rows) usage.set(r.category_id, (usage.get(r.category_id) ?? 0) + 1);
  return usage;
}

export async function fetchProduct(id: string): Promise<Product | null> {
  const row = unwrap(await supabase.from("products").select("*").eq("id", id).maybeSingle());
  return row ? asProduct(row) : null;
}

export interface ProductFilters { q: string; category?: string; status?: string; from: number; to: number }

export async function fetchProducts({ q, category, status, from, to }: ProductFilters) {
  let query = supabase.from("products").select("*, categories(name)", { count: "exact" }).order("created_at", { ascending: false }).range(from, to);
  if (q) query = query.or(`name.ilike.%${q}%,short_description.ilike.%${q}%`);
  if (category && /^[0-9a-f-]{36}$/.test(category)) query = query.eq("category_id", category);
  if (status === "active") query = query.eq("is_active", true);
  if (status === "inactive") query = query.eq("is_active", false);
  const { data, count, error } = await query;
  if (error) throw error;
  return { products: (data ?? []).map(asProduct), count: count ?? 0 };
}

/* ---------- categories ---------- */

export async function saveCategory(fd: FormData): Promise<ActionState> {
  const parsed = categorySchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fail("Please fix the highlighted fields.", fieldErrors(parsed.error));
  const id = String(fd.get("id") ?? "");
  const { error } = id
    ? await supabase.from("categories").update(parsed.data).eq("id", idSchema.parse(id))
    : await supabase.from("categories").insert(parsed.data);
  if (error) return fail(error.code === "23505" ? "A category with that name already exists." : dbMessage(error));
  return done(id ? "Category updated." : "Category created.");
}

export async function moveCategory(fd: FormData): Promise<ActionState> {
  const id = idSchema.parse(fd.get("id"));
  const step = fd.get("dir") === "up" ? -1 : 1;
  const categories = await fetchAllCategories();
  const from = categories.findIndex((c) => c.id === id);
  const to = from + step;
  if (from < 0 || to < 0 || to >= categories.length) return done("Already at the edge.");

  // Re-number everything 1..n so equal sort values never block a move.
  const order = categories.map((c) => c.id);
  [order[from], order[to]] = [order[to], order[from]];
  const results = await Promise.all(order.map((categoryId, i) => supabase.from("categories").update({ sort_order: i + 1 }).eq("id", categoryId)));
  const failed = results.find((r) => r.error);
  return failed?.error ? fail(dbMessage(failed.error)) : done("Order updated.");
}

export async function deleteCategory(fd: FormData): Promise<ActionState> {
  const id = idSchema.parse(fd.get("id"));
  const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("category_id", id);
  if (count) return fail(`This category still has ${count} product(s). Move or delete them first.`);
  const { error } = await supabase.from("categories").delete().eq("id", id);
  return error ? fail(dbMessage(error)) : done("Category deleted.");
}

/* ---------- products ---------- */

export async function saveProduct(fd: FormData): Promise<ActionState> {
  const parsed = productSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fail("Please fix the highlighted fields.", fieldErrors(parsed.error));
  const id = String(fd.get("id") ?? "");

  const upload = await uploadImage("menu-images", fd.get("image"));
  if (upload && "error" in upload) return fail(upload.error, { image: upload.error });
  const uploaded = upload && "path" in upload ? upload : null;

  const row: Record<string, unknown> = { ...parsed.data };
  if (uploaded) { row.image_url = uploaded.url; row.image_path = uploaded.path; }
  else if (fd.get("remove_image") === "on") { row.image_url = null; row.image_path = null; }
  const replacesImage = "image_path" in row;

  let previousPath: string | null = null;
  if (id) {
    idSchema.parse(id);
    const prev = unwrap(await supabase.from("products").select("image_path").eq("id", id).maybeSingle()) as { image_path: string | null } | null;
    previousPath = replacesImage ? prev?.image_path ?? null : null;
  } else {
    row.slug = `${slugify(parsed.data.name)}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const { error } = id ? await supabase.from("products").update(row).eq("id", id) : await supabase.from("products").insert(row);
  if (error) {
    await removeImage("menu-images", uploaded?.path);  // don't leave an orphaned upload behind
    return fail(dbMessage(error));
  }
  await removeImage("menu-images", previousPath);
  return done(id ? "Product updated." : "Product created.");
}

export async function toggleProduct(fd: FormData): Promise<ActionState> {
  const { error } = await supabase.from("products").update({ is_active: fd.get("to") === "true" }).eq("id", idSchema.parse(fd.get("id")));
  return error ? fail(dbMessage(error)) : done("Product visibility updated.");
}

export async function deleteProduct(fd: FormData): Promise<ActionState> {
  const id = idSchema.parse(fd.get("id"));
  const prev = unwrap(await supabase.from("products").select("image_path").eq("id", id).maybeSingle()) as { image_path: string | null } | null;
  const { error } = await supabase.from("products").delete().eq("id", id); // past orders keep their name/price snapshots
  if (error) return fail(dbMessage(error));
  await removeImage("menu-images", prev?.image_path);
  return done("Product deleted.");
}
