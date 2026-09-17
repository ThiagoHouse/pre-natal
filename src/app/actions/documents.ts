"use server";

import { revalidatePath } from "next/cache";
import { toActionError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { DOCUMENT_KINDS } from "@/lib/types";
import type { ActionState, DocumentKind } from "@/lib/types";

const MAX_PDF_BYTES = 10 * 1024 * 1024;

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function fileStem(name: string) {
  return name.replace(/\.pdf$/i, "").trim();
}

async function requireUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return { supabase, userId: data?.claims?.sub ?? null };
}

export async function createDocument(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, userId } = await requireUserId();
  if (!userId) return { error: "Sessão expirada. Entre novamente." };

  const pregnancyId = readString(formData, "pregnancy_id");
  const occurredOn = readString(formData, "occurred_on");
  const notes = readString(formData, "notes");
  const kind = readString(formData, "kind") as DocumentKind;
  const file = formData.get("file");

  if (!pregnancyId || !occurredOn) {
    return { error: "Preencha o tipo, a data e anexe o PDF." };
  }

  if (!DOCUMENT_KINDS.includes(kind)) {
    return { error: "Tipo de documento inválido." };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Anexe o PDF do exame, ultrassom ou documento." };
  }

  if (file.size > MAX_PDF_BYTES) {
    return { error: "O PDF pode ter no máximo 10 MB." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const looksLikePdf =
    bytes.length >= 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46;

  if (!looksLikePdf && !file.name.toLowerCase().endsWith(".pdf")) {
    return { error: "Envie apenas arquivos PDF." };
  }

  const title = readString(formData, "title") || fileStem(file.name) || "Documento";
  const fileId = crypto.randomUUID();
  const filePath = `${userId}/${pregnancyId}/${fileId}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from("documentos")
    .upload(filePath, bytes, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    return {
      error: toActionError(
        uploadError,
        "Não foi possível enviar o PDF. Execute supabase/pdfs.sql no Supabase.",
      ),
    };
  }

  const { error } = await supabase.from("documents").insert({
    user_id: userId,
    pregnancy_id: pregnancyId,
    kind,
    title,
    occurred_on: occurredOn,
    notes: notes || null,
    file_path: filePath,
    file_name: file.name,
  });

  if (error) {
    await supabase.storage.from("documentos").remove([filePath]);
    return { error: toActionError(error, "Não foi possível salvar o documento.") };
  }

  revalidatePath("/painel");
  return { success: "PDF adicionado à linha do tempo." };
}

export async function deleteDocument(formData: FormData): Promise<void> {
  const { supabase, userId } = await requireUserId();
  if (!userId) return;

  const id = readString(formData, "id");
  if (!id) return;

  const { data } = await supabase
    .from("documents")
    .select("file_path")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  const filePath = (data as { file_path?: string | null } | null)?.file_path;
  if (filePath) {
    await supabase.storage.from("documentos").remove([filePath]);
  }

  await supabase.from("documents").delete().eq("id", id).eq("user_id", userId);
  revalidatePath("/painel");
}
