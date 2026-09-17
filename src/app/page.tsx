import { redirect } from "next/navigation";
import { SetupNeeded } from "@/components/setup-needed";
import { getSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  if (!getSupabaseEnv().configured) {
    return <SetupNeeded />;
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  redirect(data?.claims ? "/painel" : "/entrar");
}
