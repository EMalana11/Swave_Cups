export type Role = "admin" | "staff";
export type Fulfillment = "dine_in" | "pickup" | "delivery";
export type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled";
export type PaymentStatus = "unpaid" | "paid" | "refunded";
export type TaskStatus = "not_started" | "in_progress" | "completed" | "on_hold";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface AdminProfile { id: string; email: string; full_name: string | null; role: Role; is_active: boolean; created_at: string }
export interface Category { id: string; name: string; description: string | null; sort_order: number; is_active: boolean }
export interface Product {
  id: string; category_id: string; name: string; slug: string; short_description: string | null; description: string | null;
  price: number; image_url: string | null; image_path: string | null; is_active: boolean; is_featured: boolean; created_at: string;
  categories?: { name: string } | null;
}
export interface GalleryImage {
  id: string; title: string | null; description: string | null; image_url: string; storage_path: string | null;
  photo_date: string; sort_order: number; is_published: boolean;
}
export interface HoursRow { day: string; open: string; close: string; closed: boolean }
export interface CafeSettings {
  cafe_name: string; tagline: string | null; description: string | null; phone: string | null; email: string | null;
  address: string | null; popup_location: string | null; map_url: string | null; hours: HoursRow[];
  facebook_url: string | null; instagram_url: string | null; logo_url: string | null;
  orders_enabled: boolean; dine_in_enabled: boolean; pickup_enabled: boolean; delivery_enabled: boolean;
  delivery_fee: number; min_order_amount: number; order_notice: string | null;
}
export interface Customer { id: string; full_name: string; phone: string; email: string | null; created_at: string }
export interface Order {
  id: string; order_number: string; customer_id: string | null; customer_name: string; customer_phone: string;
  customer_email: string | null; fulfillment: Fulfillment; table_number: string | null; requested_time: string | null;
  delivery_address: string | null; notes: string | null; admin_notes: string | null; subtotal: number; delivery_fee: number;
  total: number; status: OrderStatus; payment_method: "cash"; payment_status: PaymentStatus; created_at: string;
  completed_at: string | null; cancelled_at: string | null;
}
export interface OrderItem { id: string; order_id: string; product_name: string; unit_price: number; quantity: number; line_total: number }
export interface OrderEvent { id: string; from_status: OrderStatus | null; to_status: OrderStatus; created_at: string }
export interface ProjectTask {
  id: string; title: string; description: string | null; status: TaskStatus; priority: TaskPriority; category: string;
  start_date: string | null; due_date: string | null; progress_percent: number; notes: string | null; created_at: string;
  updated_at: string; completed_at: string | null;
}
export interface TaskActivity { id: string; task_id: string; actor_email: string | null; action: string; detail: string | null; created_at: string }
export interface DashboardStats {
  total_products: number; active_products: number; total_orders: number; pending: number; confirmed: number;
  preparing: number; ready: number; completed: number; cancelled: number; total_sales: number;
  recent_orders: Pick<Order, "id" | "order_number" | "customer_name" | "total" | "status" | "created_at">[];
  popular_products: { name: string; quantity: number }[];
}
export interface ActionState { ok: boolean; message?: string; errors?: Record<string, string>; ts?: number }
