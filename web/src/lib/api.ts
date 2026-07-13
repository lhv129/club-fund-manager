"use client";

/** Đọc locale hiện tại từ URL pathname (/vi/... hoặc /en/...). */
function getClientLocale(): string {
  if (typeof window !== "undefined") {
    const match = window.location.pathname.match(/^\/(vi|en)(\/|$)/);
    if (match) return match[1];
  }
  return "vi";
}

function buildQueryString(params?: Record<string, unknown>): string {
  if (!params) return "";
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    qs.append(key, String(value));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

async function request<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  payload?: unknown
): Promise<T> {
  const isFormData = payload instanceof FormData;
  const isGet = method === "GET";
  const locale = getClientLocale();

  const url = `/api/proxy${path}${isGet ? buildQueryString(payload as Record<string, unknown>) : ""}`;

  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: {
      ...(isGet || isFormData ? {} : { "Content-Type": "application/json" }),
      "Accept-Language": locale, // ✅ luôn gắn, mọi method
    },
    body:
      isGet || method === "DELETE"
        ? undefined
        : isFormData
          ? (payload as FormData)
          : JSON.stringify(payload ?? {}),
  });

  return (await res.json().catch(() => null)) as T;
}

export const apiClientBrowser = {
  get<T>(path: string, params?: Record<string, unknown>) {
    return request<T>("GET", path, params);
  },
  post<T>(path: string, body?: unknown) {
    return request<T>("POST", path, body);
  },
  put<T>(path: string, body?: unknown) {
    return request<T>("PUT", path, body);
  },
  patch<T>(path: string, body?: unknown) {
    return request<T>("PATCH", path, body);
  },
  delete<T>(path: string) {
    return request<T>("DELETE", path);
  },
};