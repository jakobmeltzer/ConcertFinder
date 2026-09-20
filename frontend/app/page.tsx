"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

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

const searchSuggestions = [
  {
    type: "Work",
    title: "Symphony No. 2",
    subtitle: "Gustav Mahler",
  },
  {
    type: "Work",
    title: "Symphony No. 5",
    subtitle: "Jean Sibelius",
  },
  {
    type: "Work",
    title: "Piano Concerto No. 2",
    subtitle: "Sergei Rachmaninoff",
  },
  {
    type: "Composer",
    title: "Gustav Mahler",
    subtitle: "Composer",
  },
  {
    type: "Orchestra",
    title: "Vienna Philharmonic",
    subtitle: "Orchestra",
  },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const filteredConcerts = useMemo(() => {
    if (!query.trim()) return [];

    const search = query.toLowerCase();

    return concerts.filter(
      (concert) =>
        concert.work.toLowerCase().includes(search) ||
        concert.composer.toLowerCase().includes(search) ||
        concert.orchestra.toLowerCase().includes(search) ||
        concert.city.toLowerCase().includes(search),
    );
  }, [query]);

  const filteredSuggestions = useMemo(() => {
    if (!query.trim()) return searchSuggestions.slice(0, 4);

    const search = query.toLowerCase();

    return searchSuggestions.filter(
      (suggestion) =>
        suggestion.title.toLowerCase().includes(search) ||
        suggestion.subtitle.toLowerCase().includes(search),
    );
  }, [query]);

  const showSearchResults = searchFocused || query.length > 0;

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-[#202020]">
      {/* Navigation */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-10">
        <Link
          href="/"
          className="group flex items-center gap-2 text-lg font-medium tracking-tight"
        >
          <span className="transition-transform duration-300 group-hover:rotate-[-8deg]">
            ♫
          </span>
          ConcertFinder
        </Link>

        <div className="hidden items-center gap-8 text-sm text-[#666] md:flex">
          <Link
            href="/works"
            className="transition-colors duration-200 hover:text-[#202020]"
          >
            Works
          </Link>

          <Link
            href="/cities"
            className="transition-colors duration-200 hover:text-[#202020]"
          >
            Cities
          </Link>

          <button
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dedbd4] text-base transition-all duration-300 hover:-translate-y-0.5 hover:border-[#202020] hover:bg-[#202020] hover:text-white"
            aria-label="Explore cities"
          >
            ◉
          </button>
        </div>

        <button className="text-sm text-[#666] transition-colors hover:text-[#202020] md:hidden">
          Menu
        </button>
      </nav>

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

        {/* Search */}
        <div className="relative mx-auto mt-12 max-w-2xl text-left">
          <div
            className={`relative rounded-2xl border bg-white shadow-[0_8px_40px_rgba(0,0,0,0.04)] transition-all duration-300 ${
              searchFocused
                ? "border-[#aaa69e] shadow-[0_12px_50px_rgba(0,0,0,0.08)]"
                : "border-[#dedbd4]"
            }`}
          >
            <div className="flex items-center px-5">
              <span
                className={`mr-3 text-xl transition-transform duration-300 ${
                  searchFocused ? "scale-110" : ""
                }`}
              >
                ⌕
              </span>

              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => {
                  // Small delay allows clicking search results.
                  setTimeout(() => setSearchFocused(false), 150);
                }}
                placeholder="Search for a composer, work or orchestra..."
                className="h-16 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[#aaa69e]"
              />

              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-sm text-[#999] transition-colors hover:bg-[#eee] hover:text-[#333]"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            {/* Search dropdown */}
            {showSearchResults && (
              <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-20 overflow-hidden rounded-2xl border border-[#dedbd4] bg-white p-2 shadow-[0_20px_60px_rgba(0,0,0,0.12)] animate-search-dropdown">
                {query && filteredConcerts.length > 0 ? (
                  <>
                    <div className="px-3 pb-2 pt-2 text-[11px] font-medium uppercase tracking-[0.15em] text-[#aaa69e]">
                      Upcoming performances
                    </div>

                    {filteredConcerts.slice(0, 4).map((concert) => (
                      <Link
                        key={concert.id}
                        href={`/works/${concert.id}`}
                        className="group flex items-center justify-between rounded-xl px-3 py-3 transition-colors duration-150 hover:bg-[#f5f3ee]"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {concert.composer} — {concert.work}
                          </p>
                          <p className="mt-1 text-xs text-[#8a877f]">
                            {concert.orchestra} · {concert.city}
                          </p>
                        </div>

                        <span className="translate-x-[-4px] text-[#aaa69e] opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
                          →
                        </span>
                      </Link>
                    ))}
                  </>
                ) : (
                  <>
                    <div className="px-3 pb-2 pt-2 text-[11px] font-medium uppercase tracking-[0.15em] text-[#aaa69e]">
                      {query ? "Suggestions" : "Popular searches"}
                    </div>

                    {filteredSuggestions.length > 0 ? (
                      filteredSuggestions.map((suggestion) => (
                        <button
                          key={`${suggestion.type}-${suggestion.title}`}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => setQuery(suggestion.title)}
                          className="group flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition-colors duration-150 hover:bg-[#f5f3ee]"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {suggestion.title}
                            </p>
                            <p className="mt-1 text-xs text-[#8a877f]">
                              {suggestion.subtitle}
                            </p>
                          </div>

                          <span className="text-[10px] uppercase tracking-wider text-[#aaa69e]">
                            {suggestion.type}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-6 text-center text-sm text-[#8a877f]">
                        No results found.
                      </div>
                    )}
                  </>
                )}

                {query && (
                  <div className="mt-1 border-t border-[#eeeae3] px-3 py-3">
                    <button className="text-xs text-[#77736b] transition-colors hover:text-[#202020]">
                      Search everything for “{query}” →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-center gap-2 text-xs text-[#aaa69e]">
            <span>Try</span>
            <button
              onClick={() => setQuery("Mahler")}
              className="underline decoration-[#d0ccc4] underline-offset-4 transition-colors hover:text-[#444]"
            >
              Mahler
            </button>
            <span>·</span>
            <button
              onClick={() => setQuery("Symphony No. 2")}
              className="underline decoration-[#d0ccc4] underline-offset-4 transition-colors hover:text-[#444]"
            >
              Symphony No. 2
            </button>
            <span>·</span>
            <button
              onClick={() => setQuery("Vienna")}
              className="underline decoration-[#d0ccc4] underline-offset-4 transition-colors hover:text-[#444]"
            >
              Vienna
            </button>
          </div>
        </div>
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
                className="group flex flex-col gap-4 py-6 transition-all duration-300 hover:px-3 md:flex-row md:items-center md:justify-between"
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
