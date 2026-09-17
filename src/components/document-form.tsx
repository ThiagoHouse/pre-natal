"use client";

import { useState, type FormEvent } from "react";
import { toActionError } from "@/lib/errors";
import { DOCUMENT_KIND_LABELS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/client";
import {
  DOCUMENT_KINDS,
  type ActionState,
  type DocumentKind,
  type PrenatalDocument,
} from "@/lib/types";

const initialState: ActionState = {};
const MAX_PDF_BYTES = 10 * 1024 * 1024;

type DocumentFormProps = {
  pregnancyId: string;
  onCreated?: (document: PrenatalDocument) => void;
};

function fileStem(name: string) {
  return name.replace(/\.pdf$/i, "").trim();
}

export function DocumentForm({ pregnancyId, onCreated }: DocumentFormProps) {
  const [state, setState] = useState<ActionState>(initialState);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const occurredOn = String(formData.get("occurred_on") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();
    const kind = String(formData.get("kind") ?? "") as DocumentKind;
    const file = formData.get("file");

    if (!occurredOn) {
      setState({ error: "Preencha o tipo, a data e anexe o PDF." });
      return;
    }

    if (!DOCUMENT_KINDS.includes(kind)) {
      setState({ error: "Tipo de documento inválido." });
      return;
    }

    if (!(file instanceof File) || file.size === 0) {
      setState({ error: "Anexe o PDF do exame, ultrassom ou documento." });
      return;
    }

    if (file.size > MAX_PDF_BYTES) {
      setState({ error: "O PDF pode ter no máximo 10 MB." });
      return;
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const looksLikePdf =
      bytes.length >= 4 &&
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46;

    if (!looksLikePdf && !file.name.toLowerCase().endsWith(".pdf")) {
      setState({ error: "Envie apenas arquivos PDF." });
      return;
    }

    setPending(true);
    setState({});

    const supabase = createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;

    if (!userId) {
      setPending(false);
      setState({ error: "Sessão expirada. Entre novamente." });
      return;
    }

    const title =
      String(formData.get("title") ?? "").trim() || fileStem(file.name) || "Documento";
    const fileId = crypto.randomUUID();
    const filePath = `${userId}/${pregnancyId}/${fileId}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("documentos")
      .upload(filePath, bytes, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      setPending(false);
      setState({
        error: toActionError(
          uploadError,
          "Não foi possível enviar o PDF. Execute supabase/pdfs.sql no Supabase.",
        ),
      });
      return;
    }

    const { data, error } = await supabase
      .from("documents")
      .insert({
        user_id: userId,
        pregnancy_id: pregnancyId,
        kind,
        title,
        occurred_on: occurredOn,
        notes: notes || null,
        file_path: filePath,
        file_name: file.name,
      })
      .select("*")
      .single();

    if (error || !data) {
      await supabase.storage.from("documentos").remove([filePath]);
      setPending(false);
      setState({
        error: toActionError(error, "Não foi possível salvar o documento."),
      });
      return;
    }

    onCreated?.(data as PrenatalDocument);
    form.reset();
    setPending(false);
    setState({ success: "PDF adicionado à linha do tempo." });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
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
          placeholder="Se vazio, usa o nome do PDF"
          className="rounded-xl border border-line bg-white px-3 py-2.5 outline-none focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
        <span className="font-medium">PDF</span>
        <input
          name="file"
          type="file"
          accept="application/pdf,.pdf"
          required
          className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-accent-soft file:px-3 file:py-1 file:text-accent"
        />
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
          {pending ? "Enviando PDF..." : "Anexar à linha do tempo"}
        </button>
      </div>
    </form>
  );
}
