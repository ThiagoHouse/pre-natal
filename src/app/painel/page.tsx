import { redirect } from "next/navigation";
import {
  Checklist,
  ChecklistProvider,
  ChecklistSummary,
} from "@/components/checklist";
import { ChecklistForm } from "@/components/checklist-form";
import { PregnancyForm } from "@/components/pregnancy-form";
import { TimelinePanel } from "@/components/timeline";
import { formatDatePt, getGestationSummary } from "@/lib/gestation";
import { createClient } from "@/lib/supabase/server";
import type { ChecklistItem, Pregnancy, PrenatalDocument } from "@/lib/types";

export default async function PainelPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/entrar");
  }

  const { data: pregnancyData } = await supabase
    .from("pregnancies")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const pregnancy = pregnancyData as Pregnancy | null;

  const [{ data: documentData }, { data: checklistData }] = pregnancy
    ? await Promise.all([
        supabase
          .from("documents")
          .select("*")
          .eq("pregnancy_id", pregnancy.id)
          .order("occurred_on", { ascending: false }),
        supabase
          .from("checklist_items")
          .select("*")
          .eq("pregnancy_id", pregnancy.id)
          .order("due_on", { ascending: true, nullsFirst: false }),
      ])
    : [{ data: [] }, { data: [] }];

  const documents = (documentData ?? []) as PrenatalDocument[];
  const checklist = (checklistData ?? []) as ChecklistItem[];

  const summary = pregnancy
    ? getGestationSummary(pregnancy.due_date, pregnancy.last_menstrual_period)
    : null;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-8">
      {!pregnancy ? (
        <section className="rounded-3xl border border-line bg-card p-6 sm:p-8">
          <h2 className="text-2xl font-semibold tracking-tight">
            Começar esta gestação
          </h2>
          <p className="mt-2 mb-6 max-w-2xl text-sm text-muted">
            Informe a data prevista de nascimento. O sistema monta um checklist
            típico de pré-natal com prazos aproximados por semana.
          </p>
          <PregnancyForm />
        </section>
      ) : (
        <ChecklistProvider items={checklist}>
          <section className="grid gap-4 lg:grid-cols-3">
            <article className="rounded-3xl border border-line bg-card p-6 lg:col-span-2">
              <p className="text-xs font-medium tracking-[0.16em] text-accent uppercase">
                {pregnancy.patient_name || "Gestação em acompanhamento"}
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                {summary?.label}
              </h2>
              <p className="mt-3 text-sm text-muted">
                Nascimento previsto em {formatDatePt(pregnancy.due_date)}
                {summary?.isOverdue
                  ? `, há ${Math.abs(summary.remaining)} dias`
                  : `, faltam ${summary?.remaining} dias`}
                .
              </p>
            </article>
            <ChecklistSummary />
          </section>

          <div className="grid items-start gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <section className="rounded-3xl border border-line bg-card p-6">
              <h3 className="text-lg font-semibold">Linha do tempo</h3>
              <p className="mt-1 mb-5 text-sm text-muted">
                PDFs agrupados por mês: exames, ultrassons, vacinas e o que mais
                o médico precisar ver. Filtre por mês ou trimestre e role os
                arquivos para o lado.
              </p>
              <TimelinePanel
                pregnancyId={pregnancy.id}
                documents={documents}
                dueDate={pregnancy.due_date}
                lastMenstrualPeriod={pregnancy.last_menstrual_period}
              />
            </section>

            <div className="space-y-6">
              <section className="rounded-3xl border border-line bg-card p-6">
                <h3 className="text-lg font-semibold">O que foi solicitado</h3>
                <p className="mt-1 mb-5 text-sm text-muted">
                  Marque o que já foi feito. Prazos atrasados aparecem no item.
                </p>
                <ChecklistForm pregnancyId={pregnancy.id} />
                <div className="mt-6">
                  <Checklist />
                </div>
              </section>

              <section className="rounded-3xl border border-line bg-card p-6">
                <h3 className="text-lg font-semibold">Dados da gestação</h3>
                <p className="mt-1 mb-5 text-sm text-muted">
                  Atualize a data prevista ou a DUM se o médico recalcular.
                </p>
                <PregnancyForm pregnancy={pregnancy} />
              </section>
            </div>
          </div>
        </ChecklistProvider>
      )}
    </main>
  );
}
