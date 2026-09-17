"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/types";

type AuthFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  includeName?: boolean;
};

const initialState: ActionState = {};

export function AuthForm({
  action,
  submitLabel,
  includeName = false,
}: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {includeName ? (
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Nome</span>
          <input
            name="name"
            autoComplete="name"
            className="rounded-xl border border-line bg-white px-3 py-2.5 outline-none focus:border-accent"
            placeholder="Como o médico deve ver no prontuário"
          />
        </label>
      ) : null}

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">E-mail</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-xl border border-line bg-white px-3 py-2.5 outline-none focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Senha</span>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete={includeName ? "new-password" : "current-password"}
          className="rounded-xl border border-line bg-white px-3 py-2.5 outline-none focus:border-accent"
        />
      </label>

      {state.error ? (
        <p className="rounded-xl bg-rose/10 px-3 py-2 text-sm text-rose">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent">
          {state.success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-full bg-accent px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Aguarde..." : submitLabel}
      </button>
    </form>
  );
}
