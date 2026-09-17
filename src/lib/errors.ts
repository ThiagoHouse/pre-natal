export function toActionError(error: unknown, fallback: string) {
  const parts: string[] = [];
  let current: unknown = error;

  for (let i = 0; i < 4 && current; i += 1) {
    if (typeof current === "string") {
      parts.push(current);
      break;
    }
    if (current instanceof Error) {
      parts.push(current.message);
      current = current.cause;
      continue;
    }
    if (typeof current === "object" && "message" in current) {
      parts.push(String((current as { message: unknown }).message));
      current =
        "cause" in current ? (current as { cause: unknown }).cause : undefined;
      continue;
    }
    break;
  }

  const text = parts.join(" ").toLowerCase();

  if (text.includes("enotfound") || text.includes("seu-projeto.supabase.co")) {
    return "A URL do Supabase ainda está com o valor de exemplo. Use a URL real no arquivo .env.local.";
  }

  if (
    text.includes("self-signed") ||
    text.includes("certificate") ||
    text.includes("unable to verify") ||
    text.includes("fetch failed")
  ) {
    const detail = parts.filter(Boolean).slice(0, 2).join(" — ");
    return `Não foi possível conectar ao Supabase${detail ? ` (${detail})` : ""}.`;
  }

  if (
    text.includes("could not find the table") ||
    text.includes("schema cache") ||
    text.includes("does not exist")
  ) {
    return "As tabelas ainda não existem no Supabase. Execute supabase/schema.sql no SQL Editor e tente de novo.";
  }

  return parts[0] || fallback;
}
