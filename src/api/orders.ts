import { z } from "zod";
import { supabase, unwrap } from "@/lib/supabase";
import { NEXT_STATUS, ORDER_STATUSES } from "@/lib/orders";
import { checkoutSchema, fieldErrors, idSchema } from "@/lib/validation";
import { dbMessage, done, fail } from "@/lib/utils";
import type { ActionState, Order, OrderEvent, OrderItem, OrderStatus } from "@/lib/types";

const FULFILLMENT_TYPES = ["dine_in", "pickup", "delivery"];

export interface OrderFilters { q: string; status?: string; type?: string; from: number; to: number }

export async function fetchOrders({ q, status, type, from, to }: OrderFilters) {
  let query = supabase.from("orders").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(from, to);
  if (q) query = query.or(`order_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%`);
  if (status && (ORDER_STATUSES as string[]).includes(status)) query = query.eq("status", status);
  if (type && FULFILLMENT_TYPES.includes(type)) query = query.eq("fulfillment", type);
  const { data, count, error } = await query;
  if (error) throw error;
  return { orders: (data ?? []) as Order[], count: count ?? 0 };
}

export async function fetchOrder(id: string): Promise<{ order: Order; items: OrderItem[]; events: OrderEvent[] } | null> {
  const [order, items, events] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).maybeSingle(),
    supabase.from("order_items").select("*").eq("order_id", id).order("product_name"),
    supabase.from("order_events").select("*").eq("order_id", id).order("created_at"),
  ]);
  const row = unwrap(order) as Order | null;
  return row ? { order: row, items: unwrap(items), events: unwrap(events) } : null;
}

export async function updateOrderStatus(fd: FormData): Promise<ActionState> {
  const id = idSchema.parse(fd.get("id"));
  const to = z.enum(["confirmed", "preparing", "ready", "completed", "cancelled"]).parse(fd.get("to")) as OrderStatus;
  const current = unwrap(await supabase.from("orders").select("status").eq("id", id).maybeSingle()) as { status: OrderStatus } | null;
  if (!current) return fail("Order not found.");
  if (!NEXT_STATUS[current.status].includes(to)) return fail("That status change is not allowed for this order.");
  const { error } = await supabase.from("orders").update({ status: to }).eq("id", id); // a DB trigger re-checks the transition
  return error ? fail(dbMessage(error)) : done("Order status updated.");
}

export async function updatePayment(fd: FormData): Promise<ActionState> {
  const id = idSchema.parse(fd.get("id"));
  const to = z.enum(["unpaid", "paid", "refunded"]).parse(fd.get("to"));
  const { error } = await supabase.from("orders").update({ payment_status: to }).eq("id", id);
  return error ? fail(dbMessage(error)) : done("Payment status updated.");
}

export async function saveOrderNotes(fd: FormData): Promise<ActionState> {
  const id = idSchema.parse(fd.get("id"));
  const notes = String(fd.get("admin_notes") ?? "").trim().slice(0, 1000) || null;
  const { error } = await supabase.from("orders").update({ admin_notes: notes }).eq("id", id);
  return error ? fail(dbMessage(error)) : done("Notes saved.");
}

export type PlaceOrderResult =
  | { ok: true; orderNumber: string }
  | { ok: false; message: string; errors?: Record<string, string> };

/** PUBLIC. Sends only product ids + quantities; the `place_order` database function re-prices everything. */
export async function placeOrder(payload: unknown): Promise<PlaceOrderResult> {
  const parsed = checkoutSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message, errors: fieldErrors(parsed.error) };
  const { website, ...order } = parsed.data;
  if (website) return { ok: false, message: "Could not place the order." }; // honeypot tripped

  const { data, error } = await supabase.rpc("place_order", { payload: order });
  if (error) return { ok: false, message: dbMessage(error, "We couldn't place your order. Please try again.") };
  return { ok: true, orderNumber: (data as { order_number: string }).order_number };
}
