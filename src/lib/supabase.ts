import { createClient, type PostgrestError } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

/** False when the .env.local file (or the Vercel environment variables) is missing; main.tsx shows a setup screen instead. */
export const isSupabaseConfigured = Boolean(url && key);

/**
 * Browser client. It only ever uses the publishable key — Row Level Security in Postgres decides what each visitor may do.
 * The placeholders keep the import from crashing when the app is not configured yet; they are never used for requests.
 */
export const supabase = createClient(url ?? "https://placeholder.supabase.co", key ?? "placeholder");

/** Returns `data`, or throws the Postgres error so React Query can surface it. */
export function unwrap<T>({ data, error }: { data: T | null; error: PostgrestError | null }): T {
  if (error) throw error;
  return data as T;
}
