import Link from "next/link";

export function SetupNeeded() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-1 flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium tracking-wide text-accent uppercase">
        Pré-natal
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Falta conectar o Supabase
      </h1>
      <p className="mt-3 max-w-xl text-muted">
        O app já está pronto para cadastro, linha do tempo e checklist. As
        informações clínicas ficam no seu projeto Supabase, protegidas por login.
      </p>

      <ol className="mt-8 space-y-4 rounded-3xl border border-line bg-card p-6 text-sm leading-6">
        <li>
          <strong>1.</strong> Crie um projeto em{" "}
          <a
            className="text-accent underline"
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
          >
            supabase.com
          </a>
          .
        </li>
        <li>
          <strong>2.</strong> Copie a URL e a chave publicável (ou anon) para um
          arquivo <code className="rounded bg-accent-soft px-1.5">.env.local</code>{" "}
          na raiz do projeto, no formato do{" "}
          <code className="rounded bg-accent-soft px-1.5">.env.example</code>.
        </li>
        <li>
          <strong>3.</strong> No SQL Editor, execute{" "}
          <code className="rounded bg-accent-soft px-1.5">
            supabase/schema.sql
          </code>
          . Se o projeto já existir, rode também{" "}
          <code className="rounded bg-accent-soft px-1.5">
            supabase/pdfs.sql
          </code>{" "}
          para anexos PDF.
        </li>
        <li>
          <strong>4.</strong> Em Authentication, pode desativar Confirm email
          enquanto testa localmente.
        </li>
        <li>
          <strong>5.</strong> Reinicie o <code>npm run dev</code>.
        </li>
      </ol>

      <p className="mt-6 text-sm text-muted">
        Depois disso, a tela inicial vira o login.{" "}
        <Link className="text-accent underline" href="/entrar">
          Tentar entrar
        </Link>
      </p>
    </main>
  );
}
