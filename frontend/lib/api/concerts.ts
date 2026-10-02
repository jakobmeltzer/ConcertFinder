import { getApiJson } from "./client";
import type { ConcertResponse } from "./types";
import { isConcert, parseList, parseResponse } from "./validation";

export async function getConcerts(): Promise<ConcertResponse[]> {
  return parseList(await getApiJson("/concerts/"), isConcert, "concerts");
}

export async function getConcert(id: string): Promise<ConcertResponse> {
  return parseResponse(await getApiJson(`/concerts/${encodeURIComponent(id)}`), isConcert, "concert");
}
