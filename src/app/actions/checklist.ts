"use server";

import { revalidatePath } from "next/cache";
import { toActionError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function todayIso() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function requireUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return { supabase, userId: data?.claims?.sub ?? null };
}

export async function createChecklistItem(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, userId } = await requireUserId();
  if (!userId) return { error: "Sessão expirada. Entre novamente." };

  const pregnancyId = readString(formData, "pregnancy_id");
  const title = readString(formData, "title");
  const requestedOn = readString(formData, "requested_on");
  const dueOn = readString(formData, "due_on");
  const notes = readString(formData, "notes");

  if (!pregnancyId || !title) {
    return { error: "Informe o que foi solicitado." };
  }

  const { error } = await supabase.from("checklist_items").insert({
    user_id: userId,
    pregnancy_id: pregnancyId,
    title,
    requested_on: requestedOn || null,
    due_on: dueOn || null,
    notes: notes || null,
    status: "pendente",
  });

  if (error) return { error: toActionError(error, "Não foi possível salvar o item.") };

  revalidatePath("/painel");
  return { success: "Item adicionado ao checklist." };
}

export async function toggleChecklistItem(formData: FormData): Promise<void> {
  const { supabase, userId } = await requireUserId();
  if (!userId) return;

  const id = readString(formData, "id");
  const current = readString(formData, "status");
  if (!id) return;

  const nextStatus = current === "concluido" ? "pendente" : "concluido";

  await supabase
    .from("checklist_items")
    .update({
      status: nextStatus,
      completed_on: nextStatus === "concluido" ? todayIso() : null,
    })
    .eq("id", id)
    .eq("user_id", userId);

  revalidatePath("/painel");
}

export async function deleteChecklistItem(formData: FormData): Promise<void> {
  const { supabase, userId } = await requireUserId();
  if (!userId) return;

  const id = readString(formData, "id");
  if (!id) return;

  await supabase
    .from("checklist_items")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  revalidatePath("/painel");
}
