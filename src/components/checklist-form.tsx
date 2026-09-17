"use client";

import { useState, type FormEvent } from "react";
import { useChecklist } from "@/components/checklist";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = {};

type ChecklistFormProps = {
  pregnancyId: string;
};

export function ChecklistForm({ pregnancyId }: ChecklistFormProps) {
  const { createItem } = useChecklist();
  const [state, setState] = useState<ActionState>(initialState);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setPending(true);
    setState({});

    const error = await createItem({
      pregnancyId,
      title: String(formData.get("title") ?? ""),
      requestedOn: String(formData.get("requested_on") ?? ""),
      dueOn: String(formData.get("due_on") ?? ""),
    });

    setPending(false);
    if (error) {
      setState({ error });
      return;
    }

    form.reset();
    setState({ success: "Item adicionado ao checklist." });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Solicitado</span>
        <input
          name="title"
          required
          placeholder="Ex.: Glicemia, ultrassom, atestado"
          className="rounded-xl border border-line bg-white px-3 py-2.5 outline-none focus:border-accent"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Data da solicitação</span>
          <input
            name="requested_on"
            type="date"
            className="rounded-xl border border-line bg-white px-3 py-2.5 outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Fazer até</span>
          <input
            name="due_on"
            type="date"
            className="rounded-xl border border-line bg-white px-3 py-2.5 outline-none focus:border-accent"
          />
        </label>
      </div>

      {state.error ? <p className="text-sm text-rose">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-accent">{state.success}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full border border-line px-4 py-2 text-sm font-medium hover:bg-accent-soft disabled:opacity-60"
      >
        {pending ? "Adicionando..." : "Incluir no checklist"}
      </button>
    </form>
  );
}
