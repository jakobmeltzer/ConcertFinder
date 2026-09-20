export type InstrumentGroup = {
  name: string;
  instruments: string[];
};

export type Work = {
  id: string;
  title: string;
  subtitle?: string;
  composer: string;
  year: string;
  period: string;
  duration: string;
  premiered: string;
  description: string;
  about: string[];
  instrumentationSummary: string;
  instrumentation: InstrumentGroup[];
  relatedWorks: string[];
};

export const works: Work[] = [
  // ─────────────────────────────────────────────
  // MAHLER — SYMPHONY NO. 2
  // ─────────────────────────────────────────────
  {
    id: "mahler-symphony-no-2",
    title: "Symphony No. 2",
    subtitle: "“Resurrection”",
    composer: "Gustav Mahler",
    year: "1894",
    period: "Late Romantic",
    duration: "~80–90 min",
    premiered: "1895",

    description:
      "Mahler's monumental Second Symphony moves from darkness and death toward resurrection, combining a huge orchestra with solo voices and choir.",

    about: [
      "Mahler's Second Symphony is one of the defining works of the late Romantic symphonic repertoire. Beginning with a funeral march and ending in an enormous choral finale, the work explores death, remembrance and the possibility of resurrection.",

      "Its enormous forces make it particularly interesting to track: performances require not only a large orchestra, but also solo singers, choir and organ.",
    ],

    instrumentationSummary:
      "Large orchestra, solo voices, mixed choir & children's choir",

    instrumentation: [
      {
        name: "Woodwinds",
        instruments: [
          "Piccolo",
          "4 × Flute",
          "4 × Oboe",
          "English horn",
          "3 × Clarinet",
          "Bass clarinet",
          "3 × Bassoon",
          "Contrabassoon",
        ],
      },
      {
        name: "Brass",
        instruments: [
          "10 × Horn",
          "6 × Trumpet",
          "4 × Trombone",
          "Tuba",
        ],
      },
      {
        name: "Percussion",
        instruments: [
          "Timpani",
          "Bass drum",
          "Snare drum",
          "Cymbals",
          "Tam-tam",
          "Triangle",
          "Glockenspiel",
          "Cowbells",
        ],
      },
      {
        name: "Keyboard",
        instruments: [
          "Organ",
          "Piano",
        ],
      },
      {
        name: "Voices",
        instruments: [
          "Soprano solo",
          "Mezzo-soprano solo",
          "Mixed choir",
          "Children's choir",
        ],
      },
      {
        name: "Strings",
        instruments: [
          "1st Violins",
          "2nd Violins",
          "Violas",
          "Cellos",
          "Double basses",
        ],
      },
    ],

    relatedWorks: [
      "mahler-symphony-no-1",
      "mahler-symphony-no-5",
      "bruckner-symphony-no-7",
    ],
  },

  // ─────────────────────────────────────────────
  // MAHLER — SYMPHONY NO. 1
  // ─────────────────────────────────────────────
  {
    id: "mahler-symphony-no-1",
    title: "Symphony No. 1",
    subtitle: "“Titan”",
    composer: "Gustav Mahler",
    year: "1888",
    period: "Late Romantic",
    duration: "~50–55 min",
    premiered: "1889",

    description:
      "Mahler's First Symphony introduces his distinctive symphonic language, combining lyrical melodies, folk influences and powerful orchestral writing.",

    about: [
      "Mahler's First Symphony was initially conceived as a symphonic poem before evolving into the four-movement symphony known today.",

      "The work is notable for its unusual orchestral colours, including the famous opening built around a sustained harmonic texture and distant fanfares.",
    ],

    instrumentationSummary:
      "Large orchestra with prominent woodwind and brass sections",

    instrumentation: [
      {
        name: "Woodwinds",
        instruments: [
          "4 × Flute",
          "3 × Oboe",
          "English horn",
          "3 × Clarinet",
          "Bass clarinet",
          "3 × Bassoon",
        ],
      },
      {
        name: "Brass",
        instruments: [
          "7 × Horn",
          "4 × Trumpet",
          "3 × Trombone",
          "Tuba",
        ],
      },
      {
        name: "Percussion",
        instruments: [
          "Timpani",
          "Bass drum",
          "Cymbals",
          "Triangle",
          "Glockenspiel",
        ],
      },
      {
        name: "Strings",
        instruments: [
          "1st Violins",
          "2nd Violins",
          "Violas",
          "Cellos",
          "Double basses",
        ],
      },
    ],

    relatedWorks: [
      "mahler-symphony-no-2",
      "mahler-symphony-no-5",
    ],
  },

  // ─────────────────────────────────────────────
  // MAHLER — SYMPHONY NO. 5
  // ─────────────────────────────────────────────
  {
    id: "mahler-symphony-no-5",
    title: "Symphony No. 5",
    composer: "Gustav Mahler",
    year: "1902",
    period: "Late Romantic",
    duration: "~70 min",
    premiered: "1904",

    description:
      "Mahler's Fifth Symphony is one of his most dramatic instrumental works, moving from a dark funeral march toward an exuberant finale.",

    about: [
      "The Fifth Symphony marks an important transition in Mahler's musical development. Unlike the preceding symphonies, it does not use voices or a programmatic text.",

      "Its famous Adagietto has become one of Mahler's most recognisable movements.",
    ],

    instrumentationSummary:
      "Large orchestra with expanded brass and percussion",

    instrumentation: [
      {
        name: "Woodwinds",
        instruments: [
          "Piccolo",
          "4 × Flute",
          "3 × Oboe",
          "English horn",
          "3 × Clarinet",
          "Bass clarinet",
          "3 × Bassoon",
          "Contrabassoon",
        ],
      },
      {
        name: "Brass",
        instruments: [
          "6 × Horn",
          "3 × Trumpet",
          "3 × Trombone",
          "Tuba",
        ],
      },
      {
        name: "Percussion",
        instruments: [
          "Timpani",
          "Bass drum",
          "Snare drum",
          "Cymbals",
          "Tam-tam",
          "Triangle",
        ],
      },
      {
        name: "Strings",
        instruments: [
          "1st Violins",
          "2nd Violins",
          "Violas",
          "Cellos",
          "Double basses",
        ],
      },
    ],

    relatedWorks: [
      "mahler-symphony-no-2",
      "mahler-symphony-no-1",
      "bruckner-symphony-no-7",
    ],
  },

  // ─────────────────────────────────────────────
  // BRUCKNER — SYMPHONY NO. 7
  // ─────────────────────────────────────────────
  {
    id: "bruckner-symphony-no-7",
    title: "Symphony No. 7",
    composer: "Anton Bruckner",
    year: "1883",
    period: "Late Romantic",
    duration: "~65–70 min",
    premiered: "1884",

    description:
      "Bruckner's Seventh Symphony is one of his most celebrated symphonies, characterised by monumental brass writing and expansive orchestral architecture.",

    about: [
      "Bruckner's Seventh Symphony was his first major international success and remains one of his most frequently performed works.",

      "The work is particularly famous for its broad melodic writing, powerful brass chorales and enormous climaxes.",
    ],

    instrumentationSummary:
      "Large orchestra with prominent horns, trumpets and Wagner tubas",

    instrumentation: [
      {
        name: "Woodwinds",
        instruments: [
          "2 × Flute",
          "2 × Oboe",
          "2 × Clarinet",
          "2 × Bassoon",
        ],
      },
      {
        name: "Brass",
        instruments: [
          "4 × Horn",
          "Wagner tubas",
          "3 × Trumpet",
          "3 × Trombone",
          "Bass tuba",
        ],
      },
      {
        name: "Percussion",
        instruments: [
          "Timpani",
          "Cymbals",
          "Triangle",
        ],
      },
      {
        name: "Strings",
        instruments: [
          "1st Violins",
          "2nd Violins",
          "Violas",
          "Cellos",
          "Double basses",
        ],
      },
    ],

    relatedWorks: [
      "mahler-symphony-no-2",
      "mahler-symphony-no-5",
    ],
  },

  // ─────────────────────────────────────────────
  // BEETHOVEN — SYMPHONY NO. 9
  // ─────────────────────────────────────────────
  {
    id: "beethoven-symphony-no-9",
    title: "Symphony No. 9",
    subtitle: "“Choral”",
    composer: "Ludwig van Beethoven",
    year: "1824",
    period: "Early Romantic",
    duration: "~65–75 min",
    premiered: "1824",

    description:
      "Beethoven's Ninth Symphony combines a monumental orchestra with four solo voices and mixed choir in its famous final movement.",

    about: [
      "Beethoven's Ninth Symphony is one of the most influential works in Western classical music.",

      "Its final movement introduces voices into the symphonic form, culminating in the famous setting of Friedrich Schiller's Ode to Joy.",
    ],

    instrumentationSummary:
      "Large orchestra, four soloists & mixed choir",

    instrumentation: [
      {
        name: "Woodwinds",
        instruments: [
          "Piccolo",
          "2 × Flute",
          "2 × Oboe",
          "2 × Clarinet",
          "2 × Bassoon",
        ],
      },
      {
        name: "Brass",
        instruments: [
          "4 × Horn",
          "2 × Trumpet",
          "3 × Trombone",
        ],
      },
      {
        name: "Percussion",
        instruments: [
          "Timpani",
          "Bass drum",
          "Cymbals",
          "Triangle",
        ],
      },
      {
        name: "Voices",
        instruments: [
          "Soprano solo",
          "Alto solo",
          "Tenor solo",
          "Bass solo",
          "Mixed choir",
        ],
      },
      {
        name: "Strings",
        instruments: [
          "1st Violins",
          "2nd Violins",
          "Violas",
          "Cellos",
          "Double basses",
        ],
      },
    ],

    relatedWorks: [
      "mahler-symphony-no-2",
      "bruckner-symphony-no-7",
    ],
  },
];

/**
 * Find a work by its ID.
 */
export function getWork(id: string): Work | undefined {
  return works.find((work) => work.id === id);
}