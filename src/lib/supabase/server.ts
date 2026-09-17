import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "@/lib/env";
import { trustedFetch } from "@/lib/trusted-fetch";

export async function createClient() {
  const { url, key, configured } = getSupabaseEnv();
  if (!configured || !url || !key) {
    throw new Error("Supabase ainda não está configurado.");
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    global: {
      fetch: trustedFetch,
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, _headers) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Chamado a partir de Server Component: o proxy cuida do refresh.
        }
      },
    },
  });
}
