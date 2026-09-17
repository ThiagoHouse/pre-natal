import { signOut } from "@/app/actions/auth";

type AppHeaderProps = {
  email?: string;
};

export function AppHeader({ email }: AppHeaderProps) {
  return (
    <header className="border-b border-line bg-card/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-accent uppercase">
            Acompanhamento
          </p>
          <h1 className="text-lg font-semibold">Pré-natal</h1>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {email ? <span className="hidden text-muted sm:inline">{email}</span> : null}
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-full border border-line px-3 py-1.5 text-sm hover:bg-accent-soft"
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
