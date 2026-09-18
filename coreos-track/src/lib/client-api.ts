/** Thin fetch wrapper used by client components. Throws with the API message. */
export async function apiRequest<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    details?: Record<string, string>;
  } & T;

  if (!response.ok) {
    const firstFieldError = payload.details
      ? Object.values(payload.details)[0]
      : undefined;
    throw new ApiError(
      firstFieldError ?? payload.error ?? "Request failed.",
      response.status,
      payload.details,
    );
  }

  return payload;
}

export class ApiError extends Error {
  status: number;
  details?: Record<string, string>;

  constructor(message: string, status: number, details?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}
