import { getWork } from "./works";

export type ProgrammeItem = {
  workId: string;
  order: number;
};

export type Concert = {
  country: ReactNode;
  city: ReactNode;
  id: string;
  date: string;
  time: string;

  orchestraId: string;
  conductor?: string;

  venueId: string;

  programme: ProgrammeItem[];

  ticketUrl?: string;
  sourceUrl?: string;
};

export const concerts: Concert[] = [
  // ─────────────────────────────────────────────
  // VIENNA — MAHLER 2
  // ─────────────────────────────────────────────
  {
    id: "vienna-philharmonic-mahler-2-2026-09-18",

    date: "18 Sep 2026",
    time: "19:30",

    conductor: "Yuja Wang",

    orchestraId: "vienna-philharmonic",
    venueId: "musikverein-vienna",

    programme: [
      {
        workId: "mahler-symphony-no-2",
        order: 1,
      },
    ],

    sourceUrl: "#",
    ticketUrl: "#",
  },

  // ─────────────────────────────────────────────
  // VIENNA — MAHLER 2
  // ─────────────────────────────────────────────
  {
    id: "vienna-philharmonic-mahler-2-2026-09-19",

    date: "19 Sep 2026",
    time: "19:30",

    orchestraId: "vienna-philharmonic",
    conductor: "Yuja Wang",

    venueId: "musikverein-vienna",

    programme: [
      {
        workId: "mahler-symphony-no-2",
        order: 1,
      },
    ],

    sourceUrl: "#",
    ticketUrl: "#",
  },

  // ─────────────────────────────────────────────
  // BERLIN — MAHLER 2 + MAHLER 1
  // ─────────────────────────────────────────────
  {
    id: "berlin-philharmonic-mahler-2-2026-09-27",

    date: "27 Sep 2026",
    time: "20:00",

    orchestraId: "berlin-philharmonic",
    conductor: "Kirill Petrenko",

    venueId: "berliner-philharmonie",

    programme: [
      {
        workId: "mahler-symphony-no-1",
        order: 1,
      },
      {
        workId: "mahler-symphony-no-2",
        order: 2,
      },
    ],

    sourceUrl: "#",
    ticketUrl: "#",
  },

  // ─────────────────────────────────────────────
  // BERLIN — MAHLER 2 + MAHLER 1
  // ─────────────────────────────────────────────
  {
    id: "berlin-philharmonic-mahler-2-2026-09-28",

    date: "28 Sep 2026",
    time: "20:00",

    orchestraId: "berlin-philharmonic",
    conductor: "Kirill Petrenko",

    venueId: "berliner-philharmonie",

    programme: [
      {
        workId: "mahler-symphony-no-1",
        order: 1,
      },
      {
        workId: "mahler-symphony-no-2",
        order: 2,
      },
    ],

    sourceUrl: "#",
    ticketUrl: "#",
  },

  // ─────────────────────────────────────────────
  // AMSTERDAM — MAHLER 2 + BRUCKNER 7
  // ─────────────────────────────────────────────
  {
    id: "concertgebouw-mahler-2-2026-10-03",

    date: "3 Oct 2026",
    time: "19:30",

    orchestraId: "concertgebouw-orchestra",
    conductor: "Klaus Mäkelä",

    venueId: "consertgebouw",

    programme: [
      {
        workId: "bruckner-symphony-no-7",
        order: 1,
      },
      {
        workId: "mahler-symphony-no-2",
        order: 2,
      },
    ],

    sourceUrl: "#",
    ticketUrl: "#",
  },

  // ─────────────────────────────────────────────
  // AMSTERDAM — MAHLER 2 + BRUCKNER 7
  // ─────────────────────────────────────────────
  {
    id: "concertgebouw-mahler-2-2026-10-04",

    date: "4 Oct 2026",
    time: "14:00",

    orchestraId: "concertgebouw-orchestra",
    conductor: "Klaus Mäkelä",

    venueId: "consertgebouw",

    programme: [
      {
        workId: "bruckner-symphony-no-7",
        order: 1,
      },
      {
        workId: "mahler-symphony-no-2",
        order: 2,
      },
    ],

    sourceUrl: "#",
    ticketUrl: "#",
  },
];

/**
 * Find a concert by its ID.
 */
export function getConcert(id: string): Concert | undefined {
  return concerts.find((concert) => concert.id === id);
}

/**
 * Get all works in a concert's programme,
 * sorted according to their programme order.
 */
export function getConcertWorks(concert: Concert) {
  return [...concert.programme]
    .sort((a, b) => a.order - b.order)
    .map((item) => getWork(item.workId))
    .filter((work) => work !== undefined);
}

/**
 * Find all concerts containing a particular work.
 */
export function getConcertsForWork(workId: string): Concert[] {
  return concerts.filter((concert) =>
    concert.programme.some((item) => item.workId === workId)
  );
}

/**
 * Check whether a concert contains a particular work.
 */
export function concertContainsWork(
  concert: Concert,
  workId: string
): boolean {
  return concert.programme.some((item) => item.workId === workId);
}