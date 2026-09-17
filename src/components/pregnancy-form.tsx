"use client";

import { useActionState } from "react";
import { savePregnancy } from "@/app/actions/pregnancy";
import type { ActionState, Pregnancy } from "@/lib/types";

const initialState: ActionState = {};

type PregnancyFormProps = {
  pregnancy?: Pregnancy | null;
};

export function PregnancyForm({ pregnancy }: PregnancyFormProps) {
  const [state, formAction, pending] = useActionState(savePregnancy, initialState);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
        <span className="font-medium">Nome da gestante</span>
        <input
          name="patient_name"
          defaultValue={pregnancy?.patient_name ?? ""}
          className="rounded-xl border border-line bg-white px-3 py-2.5 outline-none focus:border-accent"
          placeholder="Opcional"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Data prevista de nascimento</span>
        <input
          name="due_date"
          type="date"
          required
          defaultValue={pregnancy?.due_date?.slice(0, 10) ?? ""}
          className="rounded-xl border border-line bg-white px-3 py-2.5 outline-none focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Última menstruação (DUM)</span>
        <input
          name="last_menstrual_period"
          type="date"
          defaultValue={pregnancy?.last_menstrual_period?.slice(0, 10) ?? ""}
          className="rounded-xl border border-line bg-white px-3 py-2.5 outline-none focus:border-accent"
        />
        <span className="text-xs text-muted">
          Opcional. Se ficar em branco, a idade gestacional sai da data prevista.
        </span>
      </label>

      <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
        <span className="font-medium">Observações clínicas</span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={pregnancy?.notes ?? ""}
          className="rounded-xl border border-line bg-white px-3 py-2.5 outline-none focus:border-accent"
        />
      </label>

      {state.error ? <p className="text-sm text-rose sm:col-span-2">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-accent sm:col-span-2">{state.success}</p>
      ) : null}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending
            ? "Salvando..."
            : pregnancy
              ? "Atualizar gestação"
              : "Começar acompanhamento"}
        </button>
      </div>
    </form>
  );
}
