"use client";

import Link from "next/link";
import { use } from "react";
import { getConcert, getConcertWorks } from "../../data/concerts";

type ConcertPageProps = {
  params: Promise<{ id: string }>;
};

export default function ConcertPage({ params }: ConcertPageProps) {
  const { id } = use(params);

  const concert = getConcert(id);

  if (!concert) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f0] px-6">
        <div className="text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-black/40">
            Classical Concert Finder
          </p>

          <h1 className="text-3xl font-medium tracking-tight">
            Concert not found
          </h1>

          <Link
            href="/works"
            className="mt-6 inline-block text-sm text-black/60 underline underline-offset-4 transition hover:text-black"
          >
            ← Back to works
          </Link>
        </div>
      </main>
    );
  }

  const programme = getConcertWorks(concert);

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-[#202020]">
      {/* Navigation */}
      <header className="border-b border-black/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight transition-opacity hover:opacity-60"
          >
            ConcertFinder
          </Link>

          <nav className="flex items-center gap-7 text-sm text-black/60">
            <Link href="/works" className="transition-colors hover:text-black">
              Works
            </Link>

            <Link href="/cities" className="transition-colors hover:text-black">
              Cities
            </Link>

            <button
              aria-label="Explore cities"
              className="transition-transform duration-300 hover:rotate-12"
            >
              ◉
            </button>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 md:px-10">
        {/* Back navigation */}
        <div className="pt-8 md:pt-10">
          <Link
            href="/works"
            className="group inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-black/40 transition-colors hover:text-black"
          >
            <span className="transition-transform duration-300 group-hover:-translate-x-1">
              ←
            </span>
            Back
          </Link>
        </div>

        {/* Hero */}
        <section className="pb-20 pt-12 md:pb-24 md:pt-16">
          <div className="grid gap-14 md:grid-cols-[1fr_320px] md:items-end">
            <div>
              <p className="animate-fade-up text-sm font-medium uppercase tracking-[0.2em] text-black/45">
                {concert.orchestraId}
              </p>

              <h1 className="animate-fade-up mt-5 max-w-4xl text-5xl font-medium tracking-[-0.04em] md:text-7xl">
                {concert.date}
              </h1>

              <p className="animate-fade-up mt-4 text-2xl text-black/45 md:text-3xl">
                {concert.time}
              </p>
            </div>

            <div className="animate-fade-up border-t border-black/10 pt-6 md:border-l md:border-t-0 md:pl-10 md:pt-0">
              <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                Venue
              </p>

              <p className="mt-3 text-lg font-medium">{concert.venueId}</p>

              <p className="mt-1 text-sm text-black/50">
                {concert.city}, {concert.country}
              </p>
            </div>
          </div>
        </section>

        <div className="h-px bg-black/10" />

        {/* Concert information */}
        <section className="grid gap-14 py-20 md:grid-cols-[1fr_320px] md:py-24">
          {/* Programme */}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-black/40">
              Programme
            </p>

            <h2 className="mt-4 text-4xl font-medium tracking-tight md:text-5xl">
              What you&apos;ll hear
            </h2>

            <div className="mt-12 border-t border-black/10">
              {programme.length > 0 ? (
                programme.map((work, index) => (
                  <Link
                    key={work.id}
                    href={`/works/${work.id}`}
                    className="group block border-b border-black/10 py-8 transition-colors duration-300 hover:bg-black/[0.025] md:px-4"
                  >
                    <div className="grid gap-5 md:grid-cols-[50px_1fr_auto] md:items-center">
                      {/* Number */}
                      <span className="text-xs text-black/30">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      {/* Work */}
                      <div>
                        <p className="text-xs uppercase tracking-[0.15em] text-black/40">
                          {work.composer}
                        </p>

                        <h3 className="mt-2 text-xl font-medium tracking-tight md:text-2xl">
                          {work.title}
                        </h3>

                        {work.subtitle && (
                          <p className="mt-1 text-sm italic text-black/40">
                            {work.subtitle}
                          </p>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex items-center gap-5 text-sm text-black/40">
                        <span>{work.duration}</span>

                        <span className="transition-transform duration-300 group-hover:translate-x-1">
                          →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="py-12 text-sm text-black/40">
                  Programme information is not available.
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-12">
            {/* Conductor */}
            {concert.conductor && (
              <div className="border-t border-black/10 pt-6">
                <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                  Conductor
                </p>

                <p className="mt-4 text-lg font-medium">{concert.conductor}</p>
              </div>
            )}

            {/* Venue */}
            <div className="border-t border-black/10 pt-6">
              <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                Venue
              </p>

              <p className="mt-4 text-lg font-medium">{concert.venueId}</p>

              <p className="mt-1 text-sm text-black/50">
                {concert.city}, {concert.country}
              </p>
            </div>

            {/* Date */}
            <div className="border-t border-black/10 pt-6">
              <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                Date & time
              </p>

              <p className="mt-4 text-lg font-medium">{concert.date}</p>

              <p className="mt-1 text-sm text-black/50">{concert.time}</p>
            </div>

            {/* Tickets */}
            {concert.ticketUrl && concert.ticketUrl !== "#" && (
              <a
                href={concert.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex w-full items-center justify-between rounded-full bg-black px-6 py-4 text-sm text-white transition-transform duration-300 hover:scale-[1.02]"
              >
                Find tickets
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </a>
            )}
          </aside>
        </section>

        {/* Location */}
        <section className="border-y border-black/10 py-16 md:py-20">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                Location
              </p>

              <h2 className="mt-4 text-3xl font-medium tracking-tight md:text-4xl">
                {concert.venueId}
              </h2>

              <p className="mt-3 text-base text-black/50">
                {concert.city}, {concert.country}
              </p>
            </div>

            <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-black/10 bg-black/[0.025]">
              <div className="text-center">
                <div className="text-3xl">◉</div>

                <p className="mt-3 text-sm text-black/40">Map coming soon</p>
              </div>
            </div>
          </div>
        </section>

        {/* Related works */}
        <section className="py-20 md:py-24">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                Programme
              </p>

              <h2 className="mt-4 text-3xl font-medium tracking-tight md:text-4xl">
                Explore the works
              </h2>
            </div>

            <Link
              href="/works"
              className="hidden text-sm text-black/45 transition-colors hover:text-black md:block"
            >
              Browse all works →
            </Link>
          </div>

          <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-black/10 bg-black/10 md:grid-cols-2">
            {programme.map((work) => (
              <Link
                key={work.id}
                href={`/works/${work.id}`}
                className="group bg-[#f7f5f0] p-7 transition-colors duration-300 hover:bg-white md:p-8"
              >
                <p className="text-xs uppercase tracking-[0.15em] text-black/35">
                  {work.composer}
                </p>

                <h3 className="mt-4 text-xl font-medium tracking-tight">
                  {work.title}
                </h3>

                {work.subtitle && (
                  <p className="mt-1 text-sm italic text-black/40">
                    {work.subtitle}
                  </p>
                )}

                <div className="mt-8 flex items-center justify-between text-xs text-black/40">
                  <span>{work.year}</span>

                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    View work →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-black/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-xs text-black/40 md:flex-row md:items-center md:justify-between md:px-10">
          <p>ConcertFinder</p>
          <p>Discover. Listen. Travel.</p>
        </div>
      </footer>
    </main>
  );
}
