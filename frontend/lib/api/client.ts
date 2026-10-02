import "server-only";

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly path: string) {
    super(`ConcertFinder API request failed (${status}): ${path}`);
    this.name = "ApiError";
  }
}

export async function getApiJson(path: string): Promise<unknown> {
  const baseUrl = process.env.CONCERTFINDER_API_URL?.trim()
    || process.env.NEXT_PUBLIC_API_URL?.trim()
    || "http://127.0.0.1:8000";
  const response = await fetch(`${baseUrl.replace(/\/+$/, "")}${path}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    throw new ApiError(response.status, path);
  }
  return response.json();
}
