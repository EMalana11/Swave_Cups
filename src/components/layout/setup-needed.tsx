/** Shown instead of the app when the Supabase environment variables are missing (a common first-run / first-deploy mistake). */
export function SetupNeeded() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24">
      <div className="card">
        <h1 className="text-2xl font-extrabold text-navy">Supabase isn&apos;t configured yet</h1>
        <p className="mt-2 text-muted">Add these two variables, then restart <code>npm run dev</code> (or redeploy on Vercel):</p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-cream p-3 text-sm">VITE_SUPABASE_URL{"\n"}VITE_SUPABASE_PUBLISHABLE_KEY</pre>
        <p className="mt-4 text-sm text-muted">Locally, put them in <code>.env.local</code> (copy <code>.env.example</code>). On Vercel, add them under Project Settings → Environment Variables.</p>
      </div>
    </div>
  );
}
