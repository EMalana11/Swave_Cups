import { z } from "zod";

const text = (max: number) => z.string().trim().max(max);
const optText = (max: number) => text(max).transform((v) => (v === "" ? null : v));
const bool = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());
const money = z.coerce.number({ invalid_type_error: "Enter a valid amount" }).min(0, "Cannot be negative").max(100000, "Too large");
const date = z.preprocess((v) => (v === "" || v == null ? null : v), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date").nullable());
const uuid = z.string().uuid();

export const categorySchema = z.object({
  name: text(80).min(1, "Name is required"),
  description: optText(300),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
  is_active: bool,
});

export const productSchema = z.object({
  name: text(120).min(1, "Name is required"),
  category_id: z.string().uuid("Choose a category"),
  short_description: optText(200),
  description: optText(2000),
  price: money,
  is_active: bool,
  is_featured: bool,
});

export const gallerySchema = z.object({
  title: optText(150),
  description: optText(500),
  photo_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date"),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
  is_published: bool,
});

const hoursRow = z.object({ day: z.string(), open: z.string(), close: z.string(), closed: z.boolean() });
const url = optText(300).refine((v) => v === null || /^https?:\/\//i.test(v), "Must start with http:// or https://");
export const settingsSchema = z.object({
  cafe_name: text(100).min(1, "Cafe name is required"),
  tagline: optText(200),
  description: optText(1000),
  phone: optText(40),
  email: optText(120).refine((v) => v === null || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), "Invalid email"),
  address: optText(300),
  popup_location: optText(200),
  map_url: url,
  facebook_url: url,
  instagram_url: url,
  orders_enabled: bool,
  dine_in_enabled: bool,
  pickup_enabled: bool,
  delivery_enabled: bool,
  delivery_fee: money,
  min_order_amount: money,
  order_notice: optText(400),
  hours: z.array(hoursRow).length(7),
});

export const taskSchema = z.object({
  title: text(200).min(1, "Title is required"),
  description: optText(2000),
  status: z.enum(["not_started", "in_progress", "completed", "on_hold"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  category: text(80).min(1, "Category is required"),
  start_date: date,
  due_date: date,
  progress_percent: z.coerce.number().int().min(0).max(100),
  notes: optText(2000),
}).refine((t) => !t.start_date || !t.due_date || t.due_date >= t.start_date, { path: ["due_date"], message: "Due date must be on or after the start date" });

export const checkoutSchema = z.object({
  customer_name: text(100).min(2, "Please enter your name"),
  customer_phone: text(30).regex(/^[0-9+()\-\s]{7,30}$/, "Enter a valid phone number"),
  customer_email: optText(150),
  fulfillment: z.enum(["dine_in", "pickup", "delivery"]),
  table_number: optText(20),
  requested_time: optText(40),
  delivery_address: optText(300),
  notes: optText(500),
  website: z.string().max(0).optional(), // honeypot — real users leave it empty
  items: z.array(z.object({ product_id: uuid, quantity: z.number().int().min(1).max(99) })).min(1, "Your cart is empty").max(30),
});

export const staffSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(150),
  full_name: optText(100),
  role: z.enum(["admin", "staff"]),
});
export const idSchema = uuid;

export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) out[String(i.path[0] ?? "form")] ??= i.message;
  return out;
}
