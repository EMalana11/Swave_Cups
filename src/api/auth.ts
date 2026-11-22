import { z } from "zod";
import { supabase, unwrap } from "@/lib/supabase";
import { fail } from "@/lib/utils";
import type { ActionState, AdminProfile } from "@/lib/types";

const loginSchema = z.object({ email: z.string().trim().email("Enter a valid email"), password: z.string().min(1, "Enter your password").max(200) });

/** The ACTIVE admin/staff profile for a user, or null when the account has no admin access. */
export async function fetchProfile(userId: string): Promise<AdminProfile | null> {
  return unwrap(await supabase.from("admin_profiles").select("*").eq("id", userId).eq("is_active", true).maybeSingle());
}

export async function login(fd: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({ email: fd.get("email"), password: fd.get("password") });
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return fail("Invalid email or password.");

  // A valid login alone is not enough: the account must also be an ACTIVE admin/staff profile.
  if (!(await fetchProfile(data.user.id))) {
    await supabase.auth.signOut();
    return fail("This account is not authorized for the admin area.");
  }
  return { ok: true, ts: Date.now() };
}
