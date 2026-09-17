"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toActionError } from "@/lib/errors";
import { formatDatePt } from "@/lib/gestation";
import { CHECKLIST_STATUS_LABELS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/client";
import type { ChecklistItem, ChecklistStatus } from "@/lib/types";

type NewChecklistItem = {
  pregnancyId: string;
  title: string;
  requestedOn: string;
  dueOn: string;
};

type ChecklistContextValue = {
  items: ChecklistItem[];
  pendingCount: number;
  createItem: (input: NewChecklistItem) => Promise<string | null>;
  toggleItem: (item: ChecklistItem) => void;
  deleteItem: (id: string) => void;
};

const ChecklistContext = createContext<ChecklistContextValue | null>(null);

function todayIso() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sortItems(items: ChecklistItem[]) {
  return [...items].sort((a, b) => {
    if (!a.due_on && !b.due_on) return 0;
    if (!a.due_on) return 1;
    if (!b.due_on) return -1;
    return a.due_on.localeCompare(b.due_on);
  });
}

async function currentUserId() {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

function isOverdue(item: ChecklistItem) {
  if (item.status !== "pendente" || !item.due_on) return false;
  return item.due_on < todayIso();
}

export function ChecklistProvider({
  items,
  children,
}: {
  items: ChecklistItem[];
  children: ReactNode;
}) {
  const [localItems, setLocalItems] = useState(items);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const createItem = useCallback(async (input: NewChecklistItem) => {
    const title = input.title.trim();
    if (!title) return "Informe o que foi solicitado.";

    const userId = await currentUserId();
    if (!userId) return "Sessão expirada. Entre novamente.";

    const tempId = crypto.randomUUID();
    const optimistic: ChecklistItem = {
      id: tempId,
      user_id: userId,
      pregnancy_id: input.pregnancyId,
      title,
      requested_on: input.requestedOn || null,
      due_on: input.dueOn || null,
      completed_on: null,
      status: "pendente",
      notes: null,
      created_at: new Date().toISOString(),
    };

    setLocalItems((current) => sortItems([...current, optimistic]));

    const { data, error } = await createClient()
      .from("checklist_items")
      .insert({
        user_id: userId,
        pregnancy_id: input.pregnancyId,
        title,
        requested_on: input.requestedOn || null,
        due_on: input.dueOn || null,
        status: "pendente",
      })
      .select("*")
      .single();

    if (error || !data) {
      setLocalItems((current) => current.filter((item) => item.id !== tempId));
      return toActionError(error, "Não foi possível salvar o item.");
    }

    setLocalItems((current) =>
      sortItems(
        current.map((item) => (item.id === tempId ? (data as ChecklistItem) : item)),
      ),
    );
    return null;
  }, []);

  const toggleItem = useCallback((item: ChecklistItem) => {
    const nextStatus: ChecklistStatus =
      item.status === "concluido" ? "pendente" : "concluido";
    const completedOn = nextStatus === "concluido" ? todayIso() : null;
    const previous = item;

    setLocalItems((current) =>
      current.map((entry) =>
        entry.id === item.id
          ? { ...entry, status: nextStatus, completed_on: completedOn }
          : entry,
      ),
    );

    void (async () => {
      const { data, error } = await createClient()
        .from("checklist_items")
        .update({
          status: nextStatus,
          completed_on: completedOn,
        })
        .eq("id", item.id)
        .select("id");

      if (!error && data?.length) return;
      setLocalItems((current) =>
        current.map((entry) => (entry.id === previous.id ? previous : entry)),
      );
    })();
  }, []);

  const deleteItem = useCallback((id: string) => {
    let removed: ChecklistItem | undefined;
    setLocalItems((current) => {
      removed = current.find((item) => item.id === id);
      return current.filter((item) => item.id !== id);
    });

    void (async () => {
      const { data, error } = await createClient()
        .from("checklist_items")
        .delete()
        .eq("id", id)
        .select("id");

      if (!error && data?.length) return;
      const restored = removed;
      if (!restored) return;
      setLocalItems((current) => sortItems([...current, restored]));
    })();
  }, []);

  const value = useMemo<ChecklistContextValue>(
    () => ({
      items: localItems,
      pendingCount: localItems.filter((item) => item.status === "pendente").length,
      createItem,
      toggleItem,
      deleteItem,
    }),
    [createItem, deleteItem, localItems, toggleItem],
  );

  return (
    <ChecklistContext.Provider value={value}>{children}</ChecklistContext.Provider>
  );
}

export function useChecklist() {
  const context = useContext(ChecklistContext);
  if (!context) {
    throw new Error("Checklist precisa do ChecklistProvider.");
  }
  return context;
}

export function ChecklistSummary() {
  const { pendingCount } = useChecklist();

  return (
    <article className="rounded-3xl border border-line bg-accent-soft p-6">
      <p className="text-xs font-medium tracking-[0.16em] text-accent uppercase">
        Checklist
      </p>
      <p className="mt-2 text-3xl font-semibold">{pendingCount}</p>
      <p className="mt-1 text-sm text-muted">
        {pendingCount === 1 ? "solicitação pendente" : "solicitações pendentes"}
      </p>
    </article>
  );
}

export function Checklist() {
  const { items, toggleItem, deleteItem } = useChecklist();

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted">
        Nenhum item solicitado ainda. Inclua exames e retornos com prazo.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const overdue = isOverdue(item);
        const done = item.status === "concluido";

        return (
          <li
            key={item.id}
            className="rounded-2xl border border-line bg-white/70 p-4"
          >
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => toggleItem(item)}
                aria-label={done ? "Marcar como pendente" : "Marcar como concluído"}
                className={`mt-0.5 h-5 w-5 rounded-md border ${
                  done ? "border-accent bg-accent" : "border-line bg-white"
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className={`font-medium ${done ? "text-muted line-through" : ""}`}>
                    {item.title}
                  </p>
                  <button
                    type="button"
                    onClick={() => deleteItem(item.id)}
                    className="text-xs text-muted hover:text-rose"
                  >
                    Excluir
                  </button>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {CHECKLIST_STATUS_LABELS[item.status]}
                  {item.requested_on ? ` · pedido em ${formatDatePt(item.requested_on)}` : ""}
                  {item.due_on ? ` · até ${formatDatePt(item.due_on)}` : ""}
                  {item.completed_on ? ` · feito em ${formatDatePt(item.completed_on)}` : ""}
                  {overdue ? " · atrasado" : ""}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
