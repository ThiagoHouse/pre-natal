import Link from "next/link";
import { signUp } from "@/app/actions/auth";
import { AuthForm } from "@/components/auth-form";
import { SetupNeeded } from "@/components/setup-needed";
import { getSupabaseEnv } from "@/lib/env";

export default function SignUpPage() {
  if (!getSupabaseEnv().configured) {
    return <SetupNeeded />;
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium tracking-wide text-accent uppercase">
        Novo acesso
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Criar conta</h1>
      <p className="mt-2 mb-8 text-sm text-muted">
        O cadastro fica ligado ao seu usuário. Ninguém mais vê esses documentos.
      </p>
      <div className="rounded-3xl border border-line bg-card p-6">
        <AuthForm action={signUp} submitLabel="Cadastrar" includeName />
      </div>
      <p className="mt-6 text-sm text-muted">
        Já tem conta?{" "}
        <Link className="font-medium text-accent underline" href="/entrar">
          Entrar
        </Link>
      </p>
    </main>
  );
}
