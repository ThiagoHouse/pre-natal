import type { ChecklistStatus, DocumentKind } from "@/lib/types";

export const DOCUMENT_KIND_LABELS: Record<DocumentKind, string> = {
  exame: "Exame",
  ultrassom: "Ultrassom",
  atestado: "Atestado",
  consulta: "Consulta",
  receita: "Receita",
  vacina: "Vacina",
  outro: "Outro",
};

export const CHECKLIST_STATUS_LABELS: Record<ChecklistStatus, string> = {
  pendente: "Pendente",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export const DEFAULT_CHECKLIST = [
  { title: "Tipagem sanguínea e fator Rh", week: 8 },
  { title: "Hemograma completo", week: 8 },
  { title: "Glicemia de jejum", week: 8 },
  { title: "HIV", week: 8 },
  { title: "Sífilis (VDRL)", week: 8 },
  { title: "Hepatite B (HBsAg)", week: 8 },
  { title: "Toxoplasmose", week: 8 },
  { title: "Urina tipo I e urocultura", week: 8 },
  { title: "Ultrassom do 1º trimestre", week: 12 },
  { title: "Ultrassom morfológico", week: 20 },
  { title: "Teste de tolerância à glicose (TOTG)", week: 24 },
  { title: "Reforço de exames infecciosos", week: 28 },
  { title: "Ultrassom do 3º trimestre", week: 32 },
  { title: "Estreptococo do grupo B", week: 35 },
] as const;
