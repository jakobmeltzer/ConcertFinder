import { getApiJson } from "./client";
import type { WorkDetailResponse, WorkResponse } from "./types";
import { isWork, isWorkDetail, parseList, parseResponse } from "./validation";

// Preserve existing type imports while consumers move to the shared contracts.
export type { ComposerResponse, WorkResponse } from "./types";

export function parseWorks(value: unknown): WorkResponse[] {
  return parseList(value, isWork, "works");
}

export async function getWorks(): Promise<WorkResponse[]> {
  return parseWorks(await getApiJson("/works/"));
}

export async function getWork(id: string): Promise<WorkDetailResponse> {
  return parseResponse(await getApiJson(`/works/${encodeURIComponent(id)}`), isWorkDetail, "work");
}
