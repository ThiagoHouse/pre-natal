const MS_PER_DAY = 86_400_000;
const PREGNANCY_DAYS = 280;

function parseDateOnly(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isValidDate(date: Date) {
  return !Number.isNaN(date.getTime());
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function diffDays(from: Date, to: Date) {
  return Math.round(
    (startOfDay(to).getTime() - startOfDay(from).getTime()) / MS_PER_DAY,
  );
}

export function estimatedLmp(dueDate: string, lastMenstrualPeriod?: string | null) {
  const due = parseDateOnly(dueDate);
  const fromDue = addDays(due, -PREGNANCY_DAYS);

  if (!lastMenstrualPeriod) {
    return fromDue;
  }

  const lmp = parseDateOnly(lastMenstrualPeriod);
  const today = startOfDay(new Date());
  const plausible =
    isValidDate(lmp) && lmp < due && lmp <= today && diffDays(lmp, due) >= 200;

  return plausible ? lmp : fromDue;
}

export function dateForGestationalWeek(dueDate: string, week: number, lmp?: string | null) {
  return formatDateInput(addDays(estimatedLmp(dueDate, lmp), week * 7));
}

export function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDatePt(value: string) {
  return parseDateOnly(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatMonthYear(value: string) {
  const date = parseDateOnly(`${value}-01`);
  const label = date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function monthKey(value: string) {
  return value.slice(0, 7);
}

export function gestationalTrimester(
  occurredOn: string,
  dueDate: string,
  lmp?: string | null,
) {
  const weeks = Math.floor(
    diffDays(estimatedLmp(dueDate, lmp), parseDateOnly(occurredOn)) / 7,
  );
  if (weeks < 14) return 1;
  if (weeks < 28) return 2;
  return 3;
}

export function getGestationSummary(dueDate: string, lmp?: string | null, today = new Date()) {
  const due = parseDateOnly(dueDate);
  const now = startOfDay(today);
  const remaining = diffDays(now, due);
  const start = estimatedLmp(dueDate, lmp);
  const elapsed = Math.max(0, remaining > 0 ? PREGNANCY_DAYS - remaining : diffDays(start, now));
  const weeks = Math.floor(elapsed / 7);
  const extraDays = elapsed % 7;

  return {
    weeks,
    extraDays,
    remaining,
    elapsed,
    isOverdue: remaining < 0,
    label: `${weeks} ${weeks === 1 ? "semana" : "semanas"} + ${extraDays} ${extraDays === 1 ? "dia" : "dias"}`,
  };
}
