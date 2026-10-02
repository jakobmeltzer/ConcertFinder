import Link from "next/link";
import type { ConcertResponse } from "../../../lib/api/types";
import { formatConcertDate } from "../../../lib/concert-date";

function externalUrl(value: string | null): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : undefined;
  } catch { return undefined; }
}

export default function ConcertDetail({ concert }: { concert: ConcertResponse }) {
  const programme = [...concert.programme].sort((a, b) => a.order - b.order);
  const { orchestra, venue } = concert;
  const ticketUrl = externalUrl(concert.ticket_url);
  const sourceUrl = externalUrl(concert.source_url);
  return (
    <main className="min-h-screen bg-[#f7f5f0] text-[#202020]">


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
                {orchestra.name}
              </p>

              <h1 className="animate-fade-up mt-5 max-w-4xl text-5xl font-medium tracking-[-0.04em] md:text-7xl">
                {formatConcertDate(concert.date)}
              </h1>

              <p className="animate-fade-up mt-4 text-2xl text-black/45 md:text-3xl">
                {concert.time.slice(0, 5)}
              </p>
            </div>

            <div className="animate-fade-up border-t border-black/10 pt-6 md:border-l md:border-t-0 md:pl-10 md:pt-0">
              <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                Venue
              </p>

              <p className="mt-3 text-lg font-medium">
                {venue.name}
              </p>

              <p className="mt-1 text-sm text-black/50">
                {venue.city}, {venue.country}
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
                programme.map(({ work, order }, index) => (
                  <Link
                    key={`${order}-${work.id}-${index}`}
                    href={`/works/${work.id}`}
                    className="inverse-hover group block border-b border-black/10 py-8 transition-colors duration-300 hover:bg-black/[0.025] md:px-4"
                  >
                    <div className="grid gap-5 md:grid-cols-[50px_1fr_auto] md:items-center">
                      {/* Number */}
                      <span className="text-xs text-black/30">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      {/* Work */}
                      <div>
                        <p className="text-xs uppercase tracking-[0.15em] text-black/40">
                          {work.composer.name}
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

                <p className="mt-4 text-lg font-medium">{concert.conductor.name}</p>
              </div>
            )}

            {/* Venue */}
            <div className="border-t border-black/10 pt-6">
              <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                Venue
              </p>

              <p className="mt-4 text-lg font-medium">
                {venue.name}
              </p>

              <p className="mt-1 text-sm text-black/50">
                {venue.city}, {venue.country}
              </p>
            </div>

            {/* Date */}
            <div className="border-t border-black/10 pt-6">
              <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                Date & time
              </p>

              <p className="mt-4 text-lg font-medium">{formatConcertDate(concert.date)}</p>

              <p className="mt-1 text-sm text-black/50">{concert.time.slice(0, 5)}</p>
            </div>

            {/* Tickets */}
            {ticketUrl && (
              <a
                href={ticketUrl}
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
            {sourceUrl && (
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-sm text-black/50 underline underline-offset-4">Official concert information ↗</a>
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
                {venue.name}
              </h2>

              <p className="mt-3 text-base text-black/50">
                {venue.city}, {venue.country}
              </p>
              {venue.address && <p className="mt-2 text-sm text-black/50">{venue.address}</p>}
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
            {programme.map(({ work, order }, index) => (
              <Link
                key={`${order}-${work.id}-${index}`}
                href={`/works/${work.id}`}
                className="inverse-hover group bg-[#f7f5f0] p-7 transition-colors duration-300 hover:bg-white md:p-8"
              >
                <p className="text-xs uppercase tracking-[0.15em] text-black/35">
                  {work.composer.name}
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
