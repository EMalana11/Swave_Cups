import type { Fulfillment, OrderStatus, PaymentStatus } from "./types";

/** Mirrors the database trigger enforce_order_transition (the DB is the authority). */
export const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export const statusLabel = (s: OrderStatus, f?: Fulfillment) => {
  if (s === "ready") return f === "delivery" ? "Out for delivery" : f === "dine_in" ? "Ready to serve" : "Ready for pickup";
  return { pending: "Pending", confirmed: "Confirmed", preparing: "Preparing", completed: "Completed", cancelled: "Cancelled" }[s];
};
export const ORDER_STATUSES: OrderStatus[] = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"];
export const fulfillmentLabel = (f: Fulfillment) => ({ dine_in: "Dine-in", pickup: "Pickup", delivery: "Delivery" })[f];
export const paymentLabel = (p: PaymentStatus) => ({ unpaid: "Unpaid", paid: "Paid", refunded: "Refunded" })[p];

export const statusColor: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-sky-100 text-sky-800",
  preparing: "bg-indigo-100 text-indigo-800",
  ready: "bg-emerald-100 text-emerald-800",
  completed: "bg-green-200 text-green-900",
  cancelled: "bg-stone-200 text-stone-700",
};
