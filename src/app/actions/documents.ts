"use server";

import { parsePublicFileLink } from "@/lib/drive-links";
import { toActionError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { DOCUMENT_KINDS } from "@/lib/types";
import type { DocumentKind, PrenatalDocument } from "@/lib/types";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function requireUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return { supabase, userId: data?.claims?.sub ?? null };
}

export async function createDocument(formData: FormData): Promise<{
  error?: string;
  document?: PrenatalDocument;
}> {
  const { supabase, userId } = await requireUserId();
  if (!userId) return { error: "Sessão expirada. Entre novamente." };

  const pregnancyId = readString(formData, "pregnancy_id");
  const occurredOn = readString(formData, "occurred_on");
  const notes = readString(formData, "notes");
  const kind = readString(formData, "kind") as DocumentKind;
  const parsed = parsePublicFileLink(readString(formData, "file_url"));

  if (!pregnancyId || !occurredOn) {
    return { error: "Preencha o tipo, a data e o link do PDF." };
  }

  if (!DOCUMENT_KINDS.includes(kind)) {
    return { error: "Tipo de documento inválido." };
  }

  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const title = readString(formData, "title") || "Documento";

  const { data, error } = await supabase
    .from("documents")
    .insert({
      user_id: userId,
      pregnancy_id: pregnancyId,
      kind,
      title,
      occurred_on: occurredOn,
      notes: notes || null,
      drive_file_id: parsed.id,
      file_url: parsed.url,
    })
    .select("*")
    .single();

  if (error || !data) {
    return {
      error: toActionError(
        error,
        "Não foi possível salvar o documento. Execute supabase/drive.sql no Supabase.",
      ),
    };
  }

  return { document: data as PrenatalDocument };
}

export async function removePrenatalDocument(id: string): Promise<{ error?: string }> {
  const { supabase, userId } = await requireUserId();
  if (!userId) return { error: "Sessão expirada. Entre novamente." };
  if (!id) return { error: "Documento inválido." };

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

  const { error } = await supabase.from("documents").delete().eq("id", id).eq("user_id", userId);
  if (error) return { error: toActionError(error, "Não foi possível remover o documento.") };
  return {};
}
