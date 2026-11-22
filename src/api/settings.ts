import { supabase, unwrap } from "@/lib/supabase";
import { fieldErrors, settingsSchema } from "@/lib/validation";
import { DAY_ORDER } from "@/lib/hours";
import { dbMessage, done, fail } from "@/lib/utils";
import type { ActionState, CafeSettings } from "@/lib/types";

export const DEFAULT_SETTINGS: CafeSettings = {
  cafe_name: "Swave Cups Cafe", tagline: null, description: null, phone: null, email: null, address: null, popup_location: null,
  map_url: null, hours: [], facebook_url: null, instagram_url: null, logo_url: null, orders_enabled: true, dine_in_enabled: true,
  pickup_enabled: true, delivery_enabled: false, delivery_fee: 0, min_order_amount: 0, order_notice: null,
};

export async function fetchSettings(): Promise<CafeSettings> {
  const row = unwrap(await supabase.from("cafe_settings").select("*").eq("id", 1).maybeSingle()) as Partial<CafeSettings> | null;
  if (!row) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...row, hours: Array.isArray(row.hours) ? row.hours : [] };
}

export async function saveSettings(fd: FormData): Promise<ActionState> {
  const hours = DAY_ORDER.map((day, i) => ({
    day, open: String(fd.get(`open_${i}`) ?? ""), close: String(fd.get(`close_${i}`) ?? ""), closed: fd.get(`closed_${i}`) === "on",
  }));
  const parsed = settingsSchema.safeParse({ ...Object.fromEntries(fd), hours });
  if (!parsed.success) return fail("Please fix the highlighted fields.", fieldErrors(parsed.error));
  const { error } = await supabase.from("cafe_settings").update(parsed.data).eq("id", 1);
  return error ? fail(dbMessage(error)) : done("Settings saved.");
}
