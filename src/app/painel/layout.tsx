import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { getSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function PainelLayout({
  children,
}: LayoutProps<"/painel">) {
  if (!getSupabaseEnv().configured) {
    redirect("/");
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader email={typeof data?.claims?.email === "string" ? data.claims.email : undefined} />
      {children}
    </div>
  );
}
