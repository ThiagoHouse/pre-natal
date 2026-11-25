"use client";

import { useState, type FormEvent } from "react";
import { createDocument } from "@/app/actions/documents";
import { DOCUMENT_KIND_LABELS } from "@/lib/labels";
import {
  DOCUMENT_KINDS,
  type ActionState,
  type DocumentKind,
  type PrenatalDocument,
} from "@/lib/types";

const initialState: ActionState = {};

type DocumentFormProps = {
  pregnancyId: string;
  onCreated?: (document: PrenatalDocument) => void;
};

export function DocumentForm({ pregnancyId, onCreated }: DocumentFormProps) {
  const [state, setState] = useState<ActionState>(initialState);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const kind = String(new FormData(form).get("kind") ?? "") as DocumentKind;
    if (!DOCUMENT_KINDS.includes(kind)) {
      setState({ error: "Tipo de documento inválido." });
      return;
    }

    setPending(true);
    setState({});
    const result = await createDocument(new FormData(form));
    setPending(false);

    if (result.error) {
      setState({ error: result.error });
      return;
    }

    if (result.document) {
      onCreated?.(result.document);
    }
    form.reset();
    setState({ success: "PDF adicionado à linha do tempo." });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="pregnancy_id" value={pregnancyId} />

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Tipo</span>
        <select
          name="kind"
          defaultValue="exame"
          className="rounded-xl border border-line bg-white px-3 py-2.5 outline-none focus:border-accent"
        >
          {DOCUMENT_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {DOCUMENT_KIND_LABELS[kind]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Data</span>
        <input
          name="occurred_on"
          type="date"
          required
          className="rounded-xl border border-line bg-white px-3 py-2.5 outline-none focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
        <span className="font-medium">Título</span>
        <input
          name="title"
          placeholder="Ex.: Ultrassom morfológico"
          className="rounded-xl border border-line bg-white px-3 py-2.5 outline-none focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
        <span className="font-medium">Link do PDF no Google Drive</span>
        <input
          name="file_url"
          type="url"
          required
          placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
          className="rounded-xl border border-line bg-white px-3 py-2.5 outline-none focus:border-accent"
        />
        <span className="text-xs text-muted">
          No Drive: Compartilhar → Qualquer pessoa com o link → Copiar link. O
          botão Abrir PDF abre esse arquivo no navegador, como um currículo
          público.
        </span>
      </label>

      <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
        <span className="font-medium">Notas para o médico</span>
        <textarea
          name="notes"
          rows={2}
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
          className="rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Anexar à linha do tempo"}
        </button>
      </div>
    </form>
  );
}
