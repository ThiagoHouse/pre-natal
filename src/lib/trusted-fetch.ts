import http from "node:http";
import https from "node:https";

const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 8 });
const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 8,
  rejectUnauthorized: process.platform !== "win32",
});

function requestUrl(input: RequestInfo | URL) {
  if (input instanceof URL) return input;
  if (typeof input === "string") return new URL(input);
  return new URL(input.url);
}

function requestHeaders(
  input: RequestInfo | URL,
  init?: RequestInit,
): Record<string, string> {
  const headers: Record<string, string> = {};
  const raw =
    init?.headers ??
    (typeof Request !== "undefined" && input instanceof Request
      ? input.headers
      : undefined);

  if (!raw) return headers;
  if (raw instanceof Headers) {
    raw.forEach((value, key) => {
      headers[key] = value;
    });
    return headers;
  }
  if (Array.isArray(raw)) {
    for (const [key, value] of raw) {
      headers[key] = value;
    }
    return headers;
  }
  return { ...(raw as Record<string, string>) };
}

async function requestBody(init?: RequestInit) {
  if (init?.body == null) return undefined;
  if (typeof init.body === "string") return init.body;
  if (Buffer.isBuffer(init.body)) return init.body;
  if (init.body instanceof Uint8Array) return Buffer.from(init.body);
  return Buffer.from(await new Response(init.body as BodyInit).arrayBuffer());
}

export const trustedFetch: typeof fetch = (async (input, init) => {
  const url = requestUrl(input);
  const method = (init?.method ?? "GET").toUpperCase();
  const headers = requestHeaders(input, init);
  const body = await requestBody(init);

  if (body && !headers["content-length"] && !headers["Content-Length"]) {
    headers["Content-Length"] = String(Buffer.byteLength(body));
  }

  const transport = url.protocol === "http:" ? http : https;

  return new Promise<Response>((resolve, reject) => {
    const req = transport.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method,
        headers,
        agent: url.protocol === "https:" ? httpsAgent : httpAgent,
        rejectUnauthorized: process.platform !== "win32",
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        res.on("end", () => {
          const responseHeaders = new Headers();
          for (const [key, value] of Object.entries(res.headers)) {
            if (typeof value === "undefined") continue;
            responseHeaders.set(
              key,
              Array.isArray(value) ? value.join(", ") : value,
            );
          }
          resolve(
            new Response(Buffer.concat(chunks), {
              status: res.statusCode ?? 500,
              statusText: res.statusMessage ?? "",
              headers: responseHeaders,
            }),
          );
        });
      },
    );

    req.on("error", (error) => {
      reject(
        new Error(
          `fetch failed (${error.name}: ${error.message})`,
          { cause: error },
        ),
      );
    });

    if (body) req.write(body);
    req.end();
  });
}) as typeof fetch;
