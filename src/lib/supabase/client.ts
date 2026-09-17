import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/env";

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  const { url, key, configured } = getSupabaseEnv();
  if (!configured || !url || !key) {
    throw new Error("Supabase ainda não está configurado.");
  }

  if (typeof window === "undefined") {
    return createBrowserClient(url, key);
  }

  browserClient ??= createBrowserClient(url, key);
  return browserClient;
}
