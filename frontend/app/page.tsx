"use client";

import Link from "next/link";
import SearchBar from "../components/SearchBar";
import { works } from "./data/works";
import { concerts as catalogueConcerts, getConcertWorks } from "./data/concerts";
import { getOrchestra } from "./data/orchestras";
import { getVenue } from "./data/venues";
import { composerSlug } from "../lib/composerSlug";

const searchComposers = Array.from(new Map(works.map((work) => [
  work.composer, { id: composerSlug(work.composer), name: work.composer },
])).values());

const searchConcerts = catalogueConcerts.map((concert) => {
  const programme = getConcertWorks(concert);
  return {
    id: concert.id,
    work: programme.map((work) => work.title).join(" / "),
    composer: Array.from(new Set(programme.map((work) => work.composer))).join(" / "),
    orchestra: getOrchestra(concert.orchestraId)?.name ?? "",
    city: getVenue(concert.venueId)?.city ?? "",
    dateLabel: concert.date,
  };
});

type Concert = {
  id: number;
  work: string;
  composer: string;
  orchestra: string;
  city: string;
  date: string;
  dateLabel: string;
};

const concerts: Concert[] = [
  {
    id: 1,
    work: "Symphony No. 2",
    composer: "Gustav Mahler",
    orchestra: "Vienna Philharmonic",
    city: "Vienna",
    date: "2026-09-18",
    dateLabel: "18 September 2026",
  },
  {
    id: 2,
    work: "Symphony No. 7",
    composer: "Anton Bruckner",
    orchestra: "Berlin Philharmonic",
    city: "Berlin",
    date: "2026-09-25",
    dateLabel: "25 September 2026",
  },
  {
    id: 3,
    work: "Symphony No. 5",
    composer: "Jean Sibelius",
    orchestra: "Concertgebouw Orchestra",
    city: "Amsterdam",
    date: "2026-10-03",
    dateLabel: "3 October 2026",
  },
  {
    id: 4,
    work: "Piano Concerto No. 2",
    composer: "Sergei Rachmaninoff",
    orchestra: "London Symphony Orchestra",
    city: "London",
    date: "2026-10-09",
    dateLabel: "9 October 2026",
  },
  {
    id: 5,
    work: "Symphony No. 9",
    composer: "Antonín Dvořák",
    orchestra: "Czech Philharmonic",
    city: "Prague",
    date: "2026-10-15",
    dateLabel: "15 October 2026",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f5f0] text-[#202020]">


      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-24 pt-20 text-center md:px-10 md:pt-28">
        <div className="animate-fade-up">
          <p className="mb-6 text-xs font-medium uppercase tracking-[0.25em] text-[#8a877f]">
            Classical music, simplified
          </p>

          <h1 className="mx-auto max-w-3xl text-5xl font-medium leading-[1.05] tracking-[-0.04em] md:text-7xl">
            What do you
            <br />
            <span className="text-[#77736b]">want to hear?</span>
          </h1>

          <p className="mx-auto mt-7 max-w-lg text-base leading-7 text-[#77736b] md:text-lg">
            Find upcoming performances of the music you love, across orchestras,
            cities and concert halls.
          </p>
        </div>

        <SearchBar
          works={works}
          composers={searchComposers}
          concerts={searchConcerts}
          placeholder="Search for a composer, work or orchestra..."
          suggestedQueries={["Mahler", "Symphony No. 2", "Vienna"]}
          className="mx-auto mt-12 max-w-2xl text-left"
        />
      </section>

      {/* Explore */}
      <section className="mx-auto max-w-7xl px-6 pb-28 md:px-10">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-[#aaa69e]">
              Explore
            </p>
            <h2 className="text-2xl font-medium tracking-tight md:text-3xl">
              Find music your way
            </h2>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/works"
            className="group relative overflow-hidden rounded-3xl bg-[#252525] p-8 text-white transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] md:p-10"
          >
            <div className="relative z-10">
              <span className="mb-12 block text-3xl transition-transform duration-500 group-hover:translate-x-1 group-hover:scale-110">
                ♫
              </span>

              <h3 className="text-2xl font-medium tracking-tight">
                Explore by work
              </h3>

              <p className="mt-3 max-w-sm text-sm leading-6 text-white/55">
                Find every upcoming performance of the pieces you love.
              </p>

              <span className="mt-8 inline-block text-sm text-white/70 transition-transform duration-300 group-hover:translate-x-2">
                Browse works →
              </span>
            </div>

            <div className="absolute -bottom-24 -right-20 h-64 w-64 rounded-full border border-white/10 transition-transform duration-700 group-hover:scale-125" />
            <div className="absolute -bottom-16 -right-8 h-40 w-40 rounded-full border border-white/10 transition-transform duration-700 group-hover:scale-110" />
          </Link>

          <Link
            href="/cities"
            className="group relative overflow-hidden rounded-3xl border border-[#dedbd4] bg-white p-8 transition-all duration-500 hover:-translate-y-1 hover:border-[#c8c4bc] hover:shadow-[0_20px_50px_rgba(0,0,0,0.07)] md:p-10"
          >
            <div className="relative z-10">
              <span className="mb-12 block text-3xl text-[#555] transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                ◎
              </span>

              <h3 className="text-2xl font-medium tracking-tight">
                Explore by city
              </h3>

              <p className="mt-3 max-w-sm text-sm leading-6 text-[#85817a]">
                Discover what&apos;s being performed in the world&apos;s great music
                cities.
              </p>

              <span className="mt-8 inline-block text-sm text-[#666] transition-transform duration-300 group-hover:translate-x-2">
                Explore cities →
              </span>
            </div>

            <div className="absolute -bottom-28 -right-20 h-72 w-72 rounded-full border border-[#eeeae3] transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute -bottom-10 right-10 h-40 w-40 rounded-full border border-[#eeeae3] transition-transform duration-700 group-hover:scale-125" />
          </Link>
        </div>
      </section>

      {/* Upcoming concerts */}
      <section className="border-t border-[#e4e1da]">
        <div className="mx-auto max-w-7xl px-6 py-24 md:px-10">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-[#aaa69e]">
                Coming up
              </p>

              <h2 className="text-2xl font-medium tracking-tight md:text-3xl">
                Performances worth travelling for
              </h2>
            </div>

            <Link
              href="/concerts"
              className="hidden text-sm text-[#77736b] transition-colors hover:text-[#202020] md:block"
            >
              View all →
            </Link>
          </div>

          <div className="divide-y divide-[#e4e1da] border-y border-[#e4e1da]">
            {concerts.slice(0, 3).map((concert, index) => (
              <Link
                key={concert.id}
                href={`/works/${concert.id}`}
                className="inverse-hover group flex flex-col gap-4 py-6 transition-all duration-300 hover:px-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-5">
                  <span className="hidden w-5 text-xs text-[#aaa69e] md:block">
                    0{index + 1}
                  </span>

                  <div>
                    <p className="text-base font-medium">
                      {concert.composer} — {concert.work}
                    </p>

                    <p className="mt-1 text-sm text-[#85817a]">
                      {concert.orchestra}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-8 text-sm md:justify-end">
                  <div className="text-left md:text-right">
                    <p className="text-[#555]">{concert.city}</p>
                    <p className="mt-1 text-xs text-[#aaa69e]">
                      {concert.dateLabel}
                    </p>
                  </div>

                  <span className="text-[#aaa69e] transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[#555]">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <Link
            href="/concerts"
            className="mt-6 block text-sm text-[#77736b] md:hidden"
          >
            View all concerts →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e4e1da]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 text-sm text-[#99958d] md:flex-row md:items-center md:justify-between md:px-10">
          <p>ConcertFinder</p>

          <p className="tracking-wide">Discover. Listen. Travel.</p>
        </div>
      </footer>
    </main>
  );
}
