// One-time bootstrap: creates the FIRST admin. Run on your own computer:  npm run create-admin
// Needs SUPABASE_SERVICE_ROLE_KEY in .env.local. Refuses to run if an active admin already exists.
import { createClient } from "@supabase/supabase-js";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first."); process.exit(1); }

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { count, error: cErr } = await admin.from("admin_profiles").select("id", { count: "exact", head: true }).eq("role", "admin").eq("is_active", true);
if (cErr) { console.error("Could not read admin_profiles. Did you run 001_schema.sql?", cErr.message); process.exit(1); }
if (count && count > 0) { console.error("An active admin already exists. Use Admin → Staff to add people. Nothing changed."); process.exit(1); }

const rl = createInterface({ input: stdin, output: stdout });
const email = (await rl.question("Admin email: ")).trim();
const name = (await rl.question("Full name (optional): ")).trim();
// Password is typed in the terminal (echoed) — use a long unique one; you can change it later via Supabase.
const password = (await rl.question("Password (min 12 characters): ")).trim();
rl.close();
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || password.length < 12) { console.error("Invalid email or password shorter than 12 characters."); process.exit(1); }

let userId;
const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
if (created.error) {
  const list = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = list.data?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!existing) { console.error("Could not create user:", created.error.message); process.exit(1); }
  userId = existing.id;
  await admin.auth.admin.updateUserById(userId, { password });
} else userId = created.data.user.id;

const { error } = await admin.from("admin_profiles").upsert({ id: userId, email: email.toLowerCase(), full_name: name || null, role: "admin", is_active: true });
if (error) { console.error("Could not create admin profile:", error.message); process.exit(1); }
console.log(`\nDone. Sign in at /admin/login as ${email}.\nNow delete SUPABASE_SERVICE_ROLE_KEY from .env.local.`);
