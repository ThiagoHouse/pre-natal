export function driveViewUrl(fileId: string) {
  return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
}

export function documentOpenUrl(document: {
  file_url?: string | null;
  drive_file_id?: string | null;
}) {
  if (document.file_url) return document.file_url;
  if (document.drive_file_id) return driveViewUrl(document.drive_file_id);
  return null;
}

export function parsePublicFileLink(raw: string): { error: string } | { id: string | null; url: string } {
  const value = raw.trim();
  if (!value) {
    return { error: "Cole o link público do PDF no Google Drive." };
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { error: "Cole um link válido, começando com https://" };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { error: "Cole um link válido, começando com https://" };
  }

  if (url.pathname.includes("/folders/")) {
    return {
      error:
        "Esse link é de uma pasta. Abra o PDF, clique em Compartilhar, deixe qualquer pessoa com o link e copie o link do arquivo.",
    };
  }

  const fileMatch = url.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch?.[1]) {
    return { id: fileMatch[1], url: driveViewUrl(fileMatch[1]) };
  }

  const queryId = url.searchParams.get("id");
  const isGoogle =
    url.hostname.includes("drive.google.com") ||
    url.hostname.includes("docs.google.com") ||
    url.hostname.includes("googleusercontent.com");

  if (queryId && isGoogle) {
    return { id: queryId, url: driveViewUrl(queryId) };
  }

  if (isGoogle) {
    return {
      error:
        "Não reconheci esse link do Drive. No arquivo: Compartilhar → Qualquer pessoa com o link → Copiar link.",
    };
  }

  return { id: null, url: value };
}
