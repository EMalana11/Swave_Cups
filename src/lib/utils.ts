import type { ActionState } from "./types";

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export const peso = (n: number | string | null | undefined) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(Number(n ?? 0));

export const fmtDateTime = (iso: string) =>
  new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(iso));
export const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" }).format(new Date(iso.length === 10 ? iso + "T00:00:00+08:00" : iso));

export function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "") || "item";
}

export const todayManila = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date()); // YYYY-MM-DD

export const fail = (message: string, errors?: Record<string, string>): ActionState => ({ ok: false, message, errors, ts: Date.now() });
export const done = (message: string): ActionState => ({ ok: true, message, ts: Date.now() });

/** Database errors raised on purpose by our SQL functions start with "ORDER: " and are safe to show. Everything else is hidden. */
export function dbMessage(error: { message?: string; code?: string } | null, fallback = "Something went wrong. Please try again."): string {
  if (!error) return fallback;
  const m = error.message ?? "";
  if (m.startsWith("ORDER: ")) return m.slice(7);
  if (error.code === "23505") return "That value already exists.";
  if (error.code === "23503") return "This record is still in use by other data.";
  if (error.code === "42501") return "You do not have permission to do that.";
  console.error("[db]", error.code, m);
  return fallback;
}

export const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
