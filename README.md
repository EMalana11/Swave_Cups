# Swave Cups Cafe — Website + Admin

Vite · React 19 · TypeScript · Tailwind CSS · React Router · TanStack Query · Supabase (Postgres, Auth, Storage).

## Run locally
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (Supabase → Project Settings → API).
3. In the Supabase SQL Editor run, in order: `supabase/migrations/001_schema.sql`, `002_import_tracker_from_todo.sql`, and optionally `003_sample_menu_gallery.sql`.
4. Create the first admin: put `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`, run `npm run create-admin`, then delete the key.
5. `npm run dev` → site at http://localhost:5173, admin at http://localhost:5173/admin/login

## Commands
`npm run dev` · `npm run build` · `npm run preview` · `npm run typecheck` · `npm test`

## Deploy to Vercel
1. Push to GitHub and import the repo in Vercel (framework preset: Vite — `vercel.json` already handles routing and headers).
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` under Environment Variables **before** deploying. Never add the service-role key.
3. In Supabase → Authentication → URL Configuration, set the Site URL to your Vercel domain.

## Structure
```
src/
  api/          Supabase calls (reads + form actions), one file per area
  components/   ui/ (forms, tables), public/, admin/, layout/ (route shells and guards)
  hooks/        auth, shared queries, page title
  lib/          pure logic (hours, quiz, gallery, validation) — unit tested
  pages/        public/ and admin/ (admin pages are lazy-loaded)
```

## Security note
The app now talks to Supabase directly from the browser (there is no Next.js server). Security is enforced by the
database: Row Level Security, column grants, the `place_order` function and storage policies in `001_schema.sql`.
Route guards only decide what to show. Never put the service-role key in a `VITE_` variable.
