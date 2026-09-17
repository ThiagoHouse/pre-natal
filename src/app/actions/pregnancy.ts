"use server";

import { revalidatePath } from "next/cache";
import { toActionError } from "@/lib/errors";
import { dateForGestationalWeek } from "@/lib/gestation";
import { DEFAULT_CHECKLIST } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function requireUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (error || !userId) {
    return { supabase, userId: null as string | null };
  }

  return { supabase, userId };
}

export async function savePregnancy(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, userId } = await requireUserId();
  if (!userId) return { error: "Sessão expirada. Entre novamente." };

  const patientName = readString(formData, "patient_name");
  const dueDate = readString(formData, "due_date");
  const lmp = readString(formData, "last_menstrual_period");
  const notes = readString(formData, "notes");

  if (!dueDate) {
    return { error: "Informe a data prevista de nascimento." };
  }

  try {
    const payload = {
      user_id: userId,
      patient_name: patientName || null,
      due_date: dueDate,
      last_menstrual_period: lmp || null,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    };

    const { data: existing, error: existingError } = await supabase
      .from("pregnancies")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingError) {
      return { error: toActionError(existingError, "Não foi possível ler a gestação.") };
    }

    if (existing?.id) {
      const { error } = await supabase
        .from("pregnancies")
        .update(payload)
        .eq("id", existing.id);

      if (error) return { error: toActionError(error, "Não foi possível atualizar a gestação.") };
      revalidatePath("/painel");
      return { success: "Dados da gestação atualizados." };
    }

    const { data: created, error } = await supabase
      .from("pregnancies")
      .insert(payload)
      .select("id")
      .single();

    if (error || !created) {
      return {
        error: toActionError(error, "Não foi possível criar a gestação."),
      };
    }

    const checklist = DEFAULT_CHECKLIST.map((item) => ({
      user_id: userId,
      pregnancy_id: created.id,
      title: item.title,
      due_on: dateForGestationalWeek(dueDate, item.week, lmp || null),
      status: "pendente" as const,
    }));

    const { error: checklistError } = await supabase
      .from("checklist_items")
      .insert(checklist);

    if (checklistError) {
      return { error: toActionError(checklistError, "Gestação criada, mas o checklist falhou.") };
    }

    revalidatePath("/painel");
    return { success: "Gestação criada com o checklist inicial." };
  } catch (error) {
    return { error: toActionError(error, "Não foi possível salvar a gestação.") };
  }
}
