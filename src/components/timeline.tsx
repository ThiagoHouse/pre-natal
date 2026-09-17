"use client";

import { useEffect, useMemo, useState } from "react";
import { DocumentForm } from "@/components/document-form";
import {
  formatDatePt,
  formatMonthYear,
  gestationalTrimester,
  monthKey,
} from "@/lib/gestation";
import { DOCUMENT_KIND_LABELS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/client";
import { DOCUMENT_KINDS, type PrenatalDocument } from "@/lib/types";

type TimelineProps = {
  documents: PrenatalDocument[];
  dueDate: string;
  lastMenstrualPeriod?: string | null;
};

type TrimesterFilter = "todos" | "1" | "2" | "3";

export function Timeline({
  documents: serverDocuments,
  dueDate,
  lastMenstrualPeriod,
}: TimelineProps) {
  const [documents, setDocuments] = useState(serverDocuments);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [month, setMonth] = useState("todos");
  const [trimester, setTrimester] = useState<TrimesterFilter>("todos");

  useEffect(() => {
    setDocuments(serverDocuments);
  }, [serverDocuments]);

  useEffect(() => {
    const paths = documents
      .filter((document) => document.file_path)
      .map((document) => ({ id: document.id, path: document.file_path as string }));

    if (paths.length === 0) {
      setSignedUrls({});
      return;
    }

    let cancelled = false;
    const supabase = createClient();

    void Promise.all(
      paths.map(async ({ id, path }) => {
        const { data } = await supabase.storage
          .from("documentos")
          .createSignedUrl(path, 60 * 60);
        return [id, data?.signedUrl ?? ""] as const;
      }),
    ).then((entries) => {
      if (cancelled) return;
      setSignedUrls(
        Object.fromEntries(entries.filter(([, url]) => url)),
      );
    });

    return () => {
      cancelled = true;
    };
  }, [documents]);

  const months = useMemo(() => {
    const keys = new Set(documents.map((document) => monthKey(document.occurred_on)));
    return [...keys].sort((a, b) => b.localeCompare(a));
  }, [documents]);

  const filtered = useMemo(() => {
    return documents.filter((document) => {
      if (month !== "todos" && monthKey(document.occurred_on) !== month) {
        return false;
      }
      if (trimester !== "todos") {
        const value = gestationalTrimester(
          document.occurred_on,
          dueDate,
          lastMenstrualPeriod,
        );
        if (String(value) !== trimester) return false;
      }
      return true;
    });
  }, [documents, month, trimester, dueDate, lastMenstrualPeriod]);

  const grouped = useMemo(() => {
    const byMonth = new Map<string, Map<string, PrenatalDocument[]>>();

    for (const document of filtered) {
      const key = monthKey(document.occurred_on);
      if (!byMonth.has(key)) byMonth.set(key, new Map());
      const byKind = byMonth.get(key)!;
      const kindDocs = byKind.get(document.kind) ?? [];
      kindDocs.push(document);
      byKind.set(document.kind, kindDocs);
    }

    return [...byMonth.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  async function removeDocument(document: PrenatalDocument) {
    const supabase = createClient();
    setDocuments((current) => current.filter((entry) => entry.id !== document.id));

    const { error } = await supabase.from("documents").delete().eq("id", document.id);
    if (error) {
      setDocuments((current) =>
        [...current, document].sort((a, b) => b.occurred_on.localeCompare(a.occurred_on)),
      );
      return;
    }

    if (document.file_path) {
      await supabase.storage.from("documentos").remove([document.file_path]);
    }
  }

  if (documents.length === 0) {
    return (
      <p className="text-sm text-muted">
        Ainda não há PDFs nesta gestação. Anexe exames, ultrassons, vacinas e
        atestados para montar a linha do tempo.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex min-w-40 flex-1 flex-col gap-1.5 text-sm">
          <span className="font-medium">Mês</span>
          <select
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="rounded-xl border border-line bg-white px-3 py-2.5 outline-none focus:border-accent"
          >
            <option value="todos">Todos os meses</option>
            {months.map((key) => (
              <option key={key} value={key}>
                {formatMonthYear(key)}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-1 flex-col gap-1.5 text-sm">
          <span className="font-medium">Trimestre</span>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["todos", "Todos"],
                ["1", "1º"],
                ["2", "2º"],
                ["3", "3º"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTrimester(value)}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  trimester === value
                    ? "bg-accent text-white"
                    : "border border-line bg-white hover:bg-accent-soft"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {grouped.length === 0 ? (
        <p className="text-sm text-muted">Nenhum PDF neste filtro.</p>
      ) : (
        <div className="max-h-[70vh] space-y-8 overflow-y-auto pr-1">
          {grouped.map(([key, byKind]) => (
            <section key={key} className="relative border-l border-line pl-6">
              <span className="absolute top-1.5 -left-[7px] h-3.5 w-3.5 rounded-full border-2 border-card bg-accent" />
              <h4 className="text-lg font-semibold tracking-tight">
                {formatMonthYear(key)}
              </h4>
              <div className="mt-4 space-y-5">
                {DOCUMENT_KINDS.filter((kind) => byKind.has(kind)).map((kind) => (
                  <div key={kind}>
                    <p className="mb-2 text-xs font-medium tracking-[0.14em] text-accent uppercase">
                      {DOCUMENT_KIND_LABELS[kind]}
                    </p>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {byKind.get(kind)!.map((document, index) => {
                        const signedUrl = signedUrls[document.id];
                        return (
                          <article
                            key={document.id}
                            className="min-w-[220px] max-w-[240px] shrink-0 rounded-2xl border border-line bg-white p-4"
                          >
                            <p className="text-xs text-muted">
                              PDF {index + 1} · {formatDatePt(document.occurred_on)}
                            </p>
                            <h5 className="mt-1 line-clamp-2 font-medium">
                              {document.title}
                            </h5>
                            {document.notes ? (
                              <p className="mt-2 line-clamp-2 text-xs text-muted">
                                {document.notes}
                              </p>
                            ) : null}
                            <div className="mt-3 flex items-center justify-between gap-2">
                              {document.file_path ? (
                                signedUrl ? (
                                  <a
                                    href={signedUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm font-medium text-accent underline"
                                  >
                                    Abrir PDF
                                  </a>
                                ) : (
                                  <span className="text-xs text-muted">Preparando...</span>
                                )
                              ) : (
                                <span className="text-xs text-muted">Sem arquivo</span>
                              )}
                              <button
                                type="button"
                                onClick={() => void removeDocument(document)}
                                className="text-xs text-muted hover:text-rose"
                              >
                                Remover
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export function TimelinePanel({
  pregnancyId,
  documents,
  dueDate,
  lastMenstrualPeriod,
}: TimelineProps & { pregnancyId: string }) {
  const [items, setItems] = useState(documents);

  useEffect(() => {
    setItems(documents);
  }, [documents]);

  return (
    <>
      <DocumentForm
        pregnancyId={pregnancyId}
        onCreated={(document) =>
          setItems((current) => [
            document,
            ...current.filter((item) => item.id !== document.id),
          ])
        }
      />
      <div className="mt-8">
        <Timeline
          documents={items}
          dueDate={dueDate}
          lastMenstrualPeriod={lastMenstrualPeriod}
        />
      </div>
    </>
  );
}
