import { supabase, unwrap } from "@/lib/supabase";
import { fieldErrors, idSchema, staffSchema } from "@/lib/validation";
import { dbMessage, done, fail } from "@/lib/utils";
import type { ActionState, AdminProfile } from "@/lib/types";

export async function fetchStaff(): Promise<AdminProfile[]> {
  return unwrap(await supabase.from("admin_profiles").select("*").order("created_at"));
}

export async function addStaff(fd: FormData): Promise<ActionState> {
  const parsed = staffSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fail("Please fix the highlighted fields.", fieldErrors(parsed.error));
  const { error } = await supabase.rpc("staff_add", { p_email: parsed.data.email, p_full_name: parsed.data.full_name, p_role: parsed.data.role });
  return error ? fail(dbMessage(error)) : done("Staff account linked.");
}

export async function updateStaff(fd: FormData): Promise<ActionState> {
  const role = fd.get("role") === "admin" ? "admin" : "staff";
  const { error } = await supabase.rpc("staff_update", { p_id: idSchema.parse(fd.get("id")), p_role: role, p_active: fd.get("is_active") === "on" });
  return error ? fail(dbMessage(error)) : done("Staff account updated.");
}
