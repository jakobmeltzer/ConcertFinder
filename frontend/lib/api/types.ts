// Wire contracts from backend/app/schemas. Nullable fields are serialized as null.
export type ComposerResponse = {
  id: string;
  name: string;
  birth_year: number | null;
  death_year: number | null;
  period: string | null;
  description: string | null;
  website: string | null;
};

export type WorkBaseResponse = {
  id: string;
  title: string;
  subtitle: string | null;
  year: string | null;
  period: string | null;
  duration: string | null;
  premiered: string | null;
  description: string | null;
};

export type WorkResponse = WorkBaseResponse & { composer: ComposerResponse };

export type OrchestraResponse = {
  id: string;
  name: string;
  city: string;
  country: string;
  website: string | null;
};

export type VenueResponse = OrchestraResponse & {
  address: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type ConductorResponse = {
  id: string;
  name: string;
  website: string | null;
};

export type WorkPerformanceResponse = {
  id: string;
  /** ISO date (YYYY-MM-DD), not a localized display label. */
  date: string;
  /** ISO local time; the API does not supply a timezone. */
  time: string;
  orchestra: OrchestraResponse;
  venue: VenueResponse;
  conductor: ConductorResponse | null;
};

export type WorkInstrumentResponse = {
  id: string;
  name: string;
  quantity: number | null;
  display_label: string;
};

export type InstrumentGroupResponse = {
  id: string;
  name: string;
  instruments: WorkInstrumentResponse[];
};

export type WorkDetailResponse = WorkResponse & {
  about: string[];
  instrumentation_summary: string | null;
  instrumentation: InstrumentGroupResponse[];
  related_works: WorkResponse[];
  performances: WorkPerformanceResponse[];
};

export type ProgrammeWorkResponse = Pick<WorkResponse, "id" | "title" | "subtitle" | "year" | "duration" | "composer">;

export type ProgrammeItemResponse = {
  order: number;
  work: ProgrammeWorkResponse;
};

export type ConcertResponse = WorkPerformanceResponse & {
  programme: ProgrammeItemResponse[];
  ticket_url: string | null;
  source_url: string | null;
};

export type ComposerDetailResponse = ComposerResponse & {
  works: WorkResponse[];
  performances: WorkPerformanceResponse[];
};
