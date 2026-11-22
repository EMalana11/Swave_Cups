import { supabase, unwrap } from "@/lib/supabase";
import type { Customer, Order } from "@/lib/types";

export interface CustomerFilters { q: string; from: number; to: number }
export interface CustomerStats { orders: number; spent: number }

export async function fetchCustomers({ q, from, to }: CustomerFilters) {
  let query = supabase.from("customers").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(from, to);
  if (q) query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`);
  const { data, count, error } = await query;
  if (error) throw error;
  const customers = (data ?? []) as Customer[];

  const stats = new Map<string, CustomerStats>();
  if (customers.length) {
    const orders = unwrap(await supabase.from("orders").select("customer_id,total,status").in("customer_id", customers.map((c) => c.id))) as Pick<Order, "customer_id" | "total" | "status">[];
    for (const o of orders) {
      const entry = stats.get(o.customer_id!) ?? { orders: 0, spent: 0 };
      entry.orders += 1;
      if (o.status === "completed") entry.spent += Number(o.total);
      stats.set(o.customer_id!, entry);
    }
  }
  return { customers, stats, count: count ?? 0 };
}

export async function fetchCustomer(id: string): Promise<{ customer: Customer; orders: Order[] } | null> {
  const [customer, orders] = await Promise.all([
    supabase.from("customers").select("*").eq("id", id).maybeSingle(),
    supabase.from("orders").select("*").eq("customer_id", id).order("created_at", { ascending: false }),
  ]);
  const row = unwrap(customer) as Customer | null;
  return row ? { customer: row, orders: unwrap(orders) } : null;
}
