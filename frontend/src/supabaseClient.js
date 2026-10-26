import { createReader } from "./lib/postgrest";

// The site only reads from the data service, so it uses a small reader (lib/postgrest.js) rather than the full client library.
// The key is the public, read-only one: what it can do is decided by the row-level rules on the service, not by keeping it secret.
export const supabase = createReader({ url: import.meta.env.VITE_SUPABASE_URL, key: import.meta.env.VITE_SUPABASE_ANON_KEY });
