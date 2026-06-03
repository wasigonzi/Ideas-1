import { createClient } from "@supabase/supabase-js";

let browserClient: ReturnType<typeof createClient> | null = null;

/** Returns true only when the URL looks like a real Supabase project URL. */
function isValidSupabaseUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname.endsWith(".supabase.co") || hostname.endsWith(".supabase.in");
  } catch {
    return false;
  }
}

/**
 * False when NEXT_PUBLIC_SUPABASE_URL is not a real Supabase project URL
 * (e.g. mistakenly set to the app's own domain). Used to skip realtime setup.
 */
export let isSupabaseConfigured = true;

/** Browser / client-side Supabase instance (anon / publishable key). */
export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing public Supabase environment variables");
  }

  if (!isValidSupabaseUrl(supabaseUrl)) {
    console.error(
      "[Supabase] NEXT_PUBLIC_SUPABASE_URL is not a valid Supabase project URL:",
      supabaseUrl,
      "— Realtime and Storage disabled. Set the correct URL (https://<ref>.supabase.co) in your Vercel environment variables."
    );
    isSupabaseConfigured = false;
  }

  browserClient = createClient(supabaseUrl, supabaseKey);
  return browserClient;
}
