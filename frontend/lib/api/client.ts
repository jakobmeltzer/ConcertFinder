import "server-only";

export async function getApiJson(path: string): Promise<unknown> {
  const baseUrl = process.env.CONCERTFINDER_API_URL ?? "http://127.0.0.1:8000";
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    throw new Error(`ConcertFinder API request failed (${response.status})`);
  }
  return response.json();
}
