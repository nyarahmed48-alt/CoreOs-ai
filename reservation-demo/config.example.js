/**
 * Supabase connection settings for the reservation demo.
 *
 * 1. Copy this file to `config.js` (same folder).
 * 2. Fill in your project's URL and anon (public) key — Supabase Dashboard
 *    -> Project Settings -> API.
 * 3. Open index.html (customer booking) and admin.html (operator dashboard)
 *    in a browser, or serve the folder with any static file server.
 *
 * `config.js` is gitignored on purpose: it holds your project's public
 * credentials, and every deployment (or developer) should point at its own
 * Supabase project rather than sharing one committed to git.
 *
 * The anon key is safe to ship to the browser — Supabase expects it there —
 * but the `reservations` table must be protected with Row Level Security
 * policies (see schema.sql) rather than relying on the key being secret.
 *
 * Equivalent to NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in a
 * bundler-based app: this demo has no build step, so the values are read
 * from this plain script tag instead of an env file baked in at build time.
 */
window.SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
window.SUPABASE_ANON_KEY = "YOUR-PUBLIC-ANON-KEY";
