import { getApiJson } from "./client";

export type ComposerResponse = {
  id: string;
  name: string;
  birth_year?: number | null;
  death_year?: number | null;
  period?: string | null;
  description?: string | null;
  website?: string | null;
};

export type WorkResponse = {
  id: string;
  title: string;
  subtitle?: string | null;
  year?: string | null;
  period?: string | null;
  duration?: string | null;
  premiered?: string | null;
  description?: string | null;
  composer: ComposerResponse;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isWork(value: unknown): value is WorkResponse {
  if (!isRecord(value) || !isRecord(value.composer)) return false;
  const composer = value.composer;
  return typeof value.id === "string" && value.id.length > 0
    && typeof value.title === "string"
    && typeof composer.id === "string" && composer.id.length > 0
    && typeof composer.name === "string"
    && ["subtitle", "year", "period", "duration", "premiered", "description"]
      .every((key) => value[key] == null || typeof value[key] === "string")
    && ["period", "description", "website"]
      .every((key) => composer[key] == null || typeof composer[key] === "string")
    && ["birth_year", "death_year"]
      .every((key) => composer[key] == null || (typeof composer[key] === "number" && Number.isInteger(composer[key])));
}

export function parseWorks(value: unknown): WorkResponse[] {
  if (!Array.isArray(value) || !value.every(isWork)) {
    throw new Error("Invalid works response from ConcertFinder API");
  }
  if (new Set(value.map((work) => work.id)).size !== value.length) {
    throw new Error("Duplicate work IDs in ConcertFinder API response");
  }
  return value;
}

export async function getWorks(): Promise<WorkResponse[]> {
  return parseWorks(await getApiJson("/works/"));
}
