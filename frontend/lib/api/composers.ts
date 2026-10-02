import { getApiJson } from "./client";
import type { ComposerDetailResponse, ComposerResponse } from "./types";
import { isComposerDetail, isComposer, parseList, parseResponse } from "./validation";

export async function getComposers(): Promise<ComposerResponse[]> {
  return parseList(await getApiJson("/composers/"), isComposer, "composers");
}

export async function getComposer(id: string): Promise<ComposerDetailResponse> {
  return parseResponse(await getApiJson(`/composers/${encodeURIComponent(id)}`), isComposerDetail, "composer");
}
