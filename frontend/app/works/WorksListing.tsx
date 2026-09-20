"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import SearchBar from "../../components/SearchBar";
import type { WorkResponse } from "../../lib/api/works";

type Work = {
  id: string;
  title: string;
  composer: string;
  period: string;
  duration: string;
};

export default function WorksListing({ data }: { data: WorkResponse[] }) {
  const works = useMemo(() => data.map((work) => ({
    id: work.id,
    title: [work.title, work.subtitle].filter(Boolean).join(" — "),
    composer: work.composer.name,
    period: work.period ?? "",
    duration: work.duration ?? "",
  })), [data]);
  const composers = useMemo(() => Array.from(new Map(
    data.map((work) => [work.composer.id, {
      id: work.composer.id,
      name: work.composer.name,
    }]),
  ).values()), [data]);
  const popularComposers = composers.map((composer) => composer.name);
  const [query, setQuery] = useState("");
  const [selectedComposer, setSelectedComposer] = useState<string | null>(null);

  const filteredWorks = useMemo(() => {
    const search = query.trim().toLowerCase();

    return works.filter((work) => {
      const matchesSearch =
        !search ||
        work.title.toLowerCase().includes(search) ||
        work.composer.toLowerCase().includes(search) ||
        work.period.toLowerCase().includes(search);

      const matchesComposer =
        !selectedComposer || work.composer === selectedComposer;

      return matchesSearch && matchesComposer;
    });
  }, [query, selectedComposer, works]);

  const groupedWorks = useMemo(() => {
    return filteredWorks.reduce<Record<string, Work[]>>((groups, work) => {
      if (!groups[work.composer]) {
        groups[work.composer] = [];
      }

      groups[work.composer].push(work);

      return groups;
    }, {});
  }, [filteredWorks]);

  const clearFilters = () => {
    setQuery("");
    setSelectedComposer(null);
  };

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-[#202020]">


      {/* Header */}
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-20 md:px-10 md:pt-28">
        <div className="animate-fade-up">
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.25em] text-[#aaa69e]">
            Repertoire
          </p>

          <h1 className="text-5xl font-medium leading-[1.05] tracking-[-0.04em] md:text-7xl">
            Explore
            <br />
            <span className="text-[#77736b]">the repertoire.</span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-7 text-[#77736b] md:text-lg">
            Explore classical works and discover where they are
            being performed.
          </p>
        </div>

        {/* Search */}
        <div className="mt-12">
          <SearchBar
            works={works}
            composers={composers}
            placeholder="Search for a work or composer..."
            value={query}
            onQueryChange={setQuery}
          />
        </div>
      </section>

      {/* Popular composers */}
      <section className="mx-auto max-w-7xl px-6 pb-20 md:px-10">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#aaa69e]">
            Popular composers
          </p>

          {selectedComposer && (
            <button
              onClick={clearFilters}
              className="text-xs text-[#77736b] underline decoration-[#ccc8c0] underline-offset-4 transition-colors hover:text-[#202020]"
            >
              Clear filter
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {popularComposers.map((composer) => {
            const active = selectedComposer === composer;

            return (
              <button
                key={composer}
                onClick={() => setSelectedComposer(active ? null : composer)}
                className={`rounded-full border px-4 py-2.5 text-sm transition-all duration-250 ${
                  active
                    ? "border-[#202020] bg-[#202020] text-white"
                    : "border-[#dedbd4] bg-white text-[#666] hover:-translate-y-0.5 hover:border-[#aaa69e] hover:text-[#202020]"
                }`}
              >
                {composer}
              </button>
            );
          })}
        </div>
      </section>

      {/* Works */}
      <section className="border-t border-[#e4e1da]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10">
          {/* Results header */}
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-[#aaa69e]">
                {query || selectedComposer ? "Results" : "Browse"}
              </p>

              <h2 className="text-2xl font-medium tracking-tight md:text-3xl">
                {query
                  ? `Works matching “${query}”`
                  : selectedComposer
                    ? selectedComposer
                    : "Classical works"}
              </h2>
            </div>

            <span className="hidden text-sm text-[#aaa69e] md:block">
              {filteredWorks.length}{" "}
              {filteredWorks.length === 1 ? "work" : "works"}
            </span>
          </div>

          {filteredWorks.length === 0 ? (
            <div className="rounded-3xl border border-[#dedbd4] bg-white px-6 py-20 text-center">
              <div className="text-3xl text-[#aaa69e]">♫</div>

              <h3 className="mt-5 text-lg font-medium">No works found</h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#85817a]">
                Try searching for a different composer, work or period.
              </p>

              <button
                onClick={clearFilters}
                className="mt-6 rounded-full border border-[#dedbd4] px-5 py-2.5 text-sm transition-all duration-200 hover:border-[#202020] hover:bg-[#202020] hover:text-white"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="space-y-14">
              {Object.entries(groupedWorks).map(([composer, composerWorks]) => (
                <div key={composer}>
                  {/* Composer heading */}
                  <div className="mb-3 flex items-baseline justify-between border-b border-[#dcd8d0] pb-3">
                    <h3 className="text-sm font-medium">{composer}</h3>

                    <span className="text-xs text-[#aaa69e]">
                      {composerWorks.length}{" "}
                      {composerWorks.length === 1 ? "work" : "works"}
                    </span>
                  </div>

                  {/* Work list */}
                  <motion.div layout>
                    <AnimatePresence mode="popLayout">
                      {composerWorks.map((work, index) => (
                        <motion.div
                          key={work.id}
                          layout
                          initial={{
                            opacity: 0,
                            y: 12,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          exit={{
                            opacity: 0,
                            y: -8,
                          }}
                          transition={{
                            duration: 0.35,
                            delay: index * 0.04,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          <Link
                            href={`/works/${work.id}`}
                            className="group flex flex-col gap-4 border-b border-[#e8e5de] py-5 transition-all duration-300 hover:px-3 md:flex-row md:items-center md:justify-between"
                          >
                            <div className="flex min-w-0 items-center gap-5">
                              <span className="hidden text-lg text-[#c0bcb4] transition-transform duration-300 group-hover:translate-x-1 md:block">
                                ♪
                              </span>

                              <div className="min-w-0">
                                <h4 className="truncate text-base font-medium md:text-[17px]">
                                  {work.title}
                                </h4>

                                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#99958d]">
                                  {work.period && <span>{work.period}</span>}
                                  {work.period && work.duration && <span>·</span>}
                                  {work.duration && <span>{work.duration}</span>}
                                </div>
                              </div>
                            </div>

                            <div className="flex shrink-0 items-center justify-between gap-6 md:justify-end">
                              <span className="text-[#aaa69e] transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#555]">
                                →
                              </span>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-[#e4e1da]">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center md:px-10">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#aaa69e]">
            Looking for something specific?
          </p>

          <h2 className="mt-5 text-3xl font-medium tracking-tight md:text-4xl">
            Search for a piece.
            <br />
            Find where it&apos;s playing.
          </h2>

          <Link
            href="/"
            className="mt-8 inline-flex rounded-full bg-[#202020] px-6 py-3 text-sm text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#333] hover:shadow-[0_10px_25px_rgba(0,0,0,0.12)]"
          >
            Search concerts →
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
