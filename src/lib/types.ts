export const DOCUMENT_KINDS = [
  "exame",
  "ultrassom",
  "atestado",
  "consulta",
  "receita",
  "vacina",
  "outro",
] as const;

export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export const CHECKLIST_STATUSES = [
  "pendente",
  "concluido",
  "cancelado",
] as const;

export type ChecklistStatus = (typeof CHECKLIST_STATUSES)[number];

export type Pregnancy = {
  id: string;
  user_id: string;
  patient_name: string | null;
  due_date: string;
  last_menstrual_period: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PrenatalDocument = {
  id: string;
  user_id: string;
  pregnancy_id: string;
  kind: DocumentKind;
  title: string;
  occurred_on: string;
  notes: string | null;
  file_path: string | null;
  file_name: string | null;
  signed_url?: string | null;
  created_at: string;
};

export type ChecklistItem = {
  id: string;
  user_id: string;
  pregnancy_id: string;
  title: string;
  requested_on: string | null;
  due_on: string | null;
  completed_on: string | null;
  status: ChecklistStatus;
  notes: string | null;
  created_at: string;
};

export type ActionState = {
  error?: string;
  success?: string;
};
