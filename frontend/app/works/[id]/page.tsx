"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { getWork } from "../../data/works";
import { getConcertsForWork } from "../../data/concerts";
import { getOrchestra } from "../../data/orchestras";
import { getVenue } from "../../data/venues";
import StaggeredContent from "../../../components/StaggeredContent";
import { composerSlug } from "../../../lib/composerSlug";
import { motion } from "motion/react";

type WorkPageProps = {
  params: Promise<{ id: string }>;
};

export default function WorkPage({ params }: WorkPageProps) {
  const { id } = use(params);
  const work = getWork(id);
  const performances = work ? getConcertsForWork(work.id) : [];

  const performancesWithDetails = performances.map((performance) => ({
    ...performance,
    orchestra: getOrchestra(performance.orchestraId),
    venue: getVenue(performance.venueId),
  }));

  const [instrumentationOpen, setInstrumentationOpen] = useState(false);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setInstrumentationOpen(false);
      }
    }

    if (instrumentationOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [instrumentationOpen]);

  if (!work) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f0] px-6">
        <div className="text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-black/40">
            Classical Concert Finder
          </p>

          <h1 className="text-3xl font-medium tracking-tight">
            Work not found
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

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-[#202020]">


      {/* Main content */}
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        {/* Breadcrumb */}
        <StaggeredContent delay={0}>
          <div className="pt-8 md:pt-10">
            <Link
              href="/works"
              className="group inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-black/40 transition-colors hover:text-black"
            >
              <span className="transition-transform duration-300 group-hover:-translate-x-1">
                ←
              </span>
              All works
            </Link>
          </div>
        </StaggeredContent>

        {/* Hero */}
        <StaggeredContent delay={0.05}>
          <section className="pb-20 pt-12 md:pb-28 md:pt-16">
            <div className="max-w-4xl">
              <Link
                href={`/composers/${composerSlug(work.composer)}`}
                className="text-sm font-medium uppercase tracking-[0.2em] text-black/45 transition-colors hover:text-black"
              >
                {work.composer}
              </Link>

              <h1 className="mt-5 text-5xl font-medium tracking-[-0.04em] md:text-7xl lg:text-8xl">
                {work.title}
              </h1>

              {work.subtitle && (
                <p className="mt-3 text-2xl italic text-black/45 md:text-3xl">
                  {work.subtitle}
                </p>
              )}

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-black/50">
                <span>{work.year}</span>
                <span>·</span>
                <span>{work.period}</span>
                <span>·</span>
                <span>{work.duration}</span>
              </div>

              <p className="mt-10 max-w-2xl text-lg leading-8 text-black/65 md:text-xl md:leading-9">
                {work.description}
              </p>
            </div>
          </section>
        </StaggeredContent>

        {/* Divider */}
        <div className="h-px bg-black/10" />

        {/* About + metadata */}
        <StaggeredContent delay={0.05}>
          <section className="grid gap-14 py-20 md:grid-cols-[1fr_320px] md:py-24">
            <div>
              <p className="mb-8 text-xs uppercase tracking-[0.2em] text-black/40">
                About the work
              </p>

              <div className="max-w-2xl space-y-7">
                {work.about.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-base leading-8 text-black/65 md:text-lg"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            <aside className="border-t border-black/10 pt-6 md:border-l md:border-t-0 md:pl-10 md:pt-0">
              <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                Details
              </p>

              <dl className="mt-7 space-y-6">
                <Link
                  href={`/composers/${composerSlug(work.composer)}`}
                  className="text-sm font-medium uppercase tracking-[0.2em] text-black/45 transition-colors hover:text-black"
                >
                  {work.composer}
                </Link>

                <div>
                  <dt className="text-xs text-black/40">Year</dt>
                  <dd className="mt-1 text-sm">{work.year}</dd>
                </div>

                <div>
                  <dt className="text-xs text-black/40">Period</dt>
                  <dd className="mt-1 text-sm">{work.period}</dd>
                </div>

                <div>
                  <dt className="text-xs text-black/40">Duration</dt>
                  <dd className="mt-1 text-sm">{work.duration}</dd>
                </div>

                <div>
                  <dt className="text-xs text-black/40">Premiere</dt>
                  <dd className="mt-1 text-sm">{work.premiered}</dd>
                </div>
              </dl>
            </aside>
          </section>
        </StaggeredContent>

        {/* Instrumentation */}
        <StaggeredContent delay={0.05}>
          <section className="border-y border-black/10 py-16 md:py-20">
            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                  Instrumentation
                </p>

                <h2 className="mt-4 text-3xl font-medium tracking-tight md:text-4xl">
                  {work.instrumentationSummary}
                </h2>
              </div>

              <button
                onClick={() => setInstrumentationOpen(true)}
                className="group flex shrink-0 items-center gap-3 self-start rounded-full border border-black/20 px-5 py-3 text-sm transition-all duration-300 hover:border-black hover:bg-black hover:text-white md:self-auto"
              >
                View full instrumentation
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </button>
            </div>

            <div className="mt-12 grid gap-x-12 gap-y-10 md:grid-cols-3">
              {work.instrumentation.slice(0, 6).map((group) => (
                <div key={group.name}>
                  <h3 className="text-sm font-medium">{group.name}</h3>

                  <ul className="mt-4 space-y-2">
                    {group.instruments.slice(0, 5).map((instrument) => (
                      <li key={instrument} className="text-sm text-black/50">
                        {instrument}
                      </li>
                    ))}

                    {group.instruments.length > 5 && (
                      <li className="pt-1 text-xs text-black/30">
                        + {group.instruments.length - 5} more
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </StaggeredContent>

        {/* Performances */}
        <section className="py-20 md:py-28">
          {/* Performance heading */}
          <StaggeredContent delay={0}>
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                  Upcoming performances
                </p>

                <h2 className="mt-4 text-4xl font-medium tracking-tight md:text-5xl">
                  Hear it live
                </h2>
              </div>

              <span className="hidden text-sm text-black/35 md:block">
                {performances.length}{" "}
                {performances.length === 1 ? "performance" : "performances"}
              </span>
            </div>
          </StaggeredContent>

          {performances.length > 0 ? (
            <div className="mt-12 border-t border-black/10">
              {performancesWithDetails.map((performance, index) => (
                <motion.div
                  key={performance.id}
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                    amount: 0.15,
                  }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.06,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <Link
                    href={`/concerts/${performance.id}`}
                    className="inverse-hover group block border-b border-black/10 py-7 transition-colors duration-300 hover:bg-black/[0.025] md:px-4"
                  >
                    <div className="grid gap-6 md:grid-cols-[120px_1fr_auto] md:items-center">
                      <div>
                        <p className="text-sm font-medium">
                          {performance.date}
                        </p>

                        <p className="mt-1 text-xs text-black/40">
                          {performance.time}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium">
                          {performance.orchestra?.name}
                        </h3>

                        {performance.conductor && (
                          <p className="mt-1 text-sm text-black/50">
                            {performance.conductor} · {performance.venue?.name}
                          </p>
                        )}

                        <p className="mt-1 text-sm text-black/40">
                          {performance.venue?.city},{" "}
                          {performance.venue?.country}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-black/50 transition-colors group-hover:text-black">
                        View concert
                        <span className="transition-transform duration-300 group-hover:translate-x-1">
                          →
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="mt-12 border-y border-black/10 py-16 text-center">
              <p className="text-sm text-black/40">
                No upcoming performances found.
              </p>
            </div>
          )}
        </section>

        {/* Related works */}
        {work.relatedWorks.length > 0 && (
          <StaggeredContent delay={0.7}>
            <section className="border-t border-black/10 py-20 md:py-24">
              <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                You might also like
              </p>

              <div className="mt-8 grid gap-px overflow-hidden rounded-xl border border-black/10 bg-black/10 md:grid-cols-3">
                {work.relatedWorks.map((relatedId) => {
                  const relatedWork = getWork(relatedId);

                  if (!relatedWork) return null;

                  return (
                    <Link
                      key={relatedWork.id}
                      href={`/works/${relatedWork.id}`}
                      className="inverse-hover group bg-[#f7f5f0] p-7 transition-colors duration-300 hover:bg-white md:p-8"
                    >
                      <p className="text-xs uppercase tracking-[0.15em] text-black/35">
                        {relatedWork.composer}
                      </p>

                      <h3 className="mt-4 text-xl font-medium tracking-tight">
                        {relatedWork.title}
                      </h3>

                      {relatedWork.subtitle && (
                        <p className="mt-1 text-sm italic text-black/40">
                          {relatedWork.subtitle}
                        </p>
                      )}

                      <div className="mt-8 flex items-center justify-between text-xs text-black/40">
                        <span>{relatedWork.year}</span>

                        <span className="transition-transform duration-300 group-hover:translate-x-1">
                          →
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          </StaggeredContent>
        )}
      </div>

      {/* Instrumentation modal */}
      {instrumentationOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setInstrumentationOpen(false);
            }
          }}
        >
          <div
            className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-[#f7f5f0] shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="instrumentation-title"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-black/10 bg-[#f7f5f0]/95 px-6 py-5 backdrop-blur md:px-8">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                  Instrumentation
                </p>

                <h2
                  id="instrumentation-title"
                  className="mt-1 text-xl font-medium"
                >
                  {work.title}
                </h2>
              </div>

              <button
                onClick={() => setInstrumentationOpen(false)}
                aria-label="Close instrumentation"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-lg transition-colors hover:bg-black hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="grid gap-10 px-6 py-8 md:grid-cols-2 md:px-8 md:py-10">
              {work.instrumentation.map((group) => (
                <div key={group.name}>
                  <h3 className="text-sm font-medium">{group.name}</h3>

                  <ul className="mt-4 space-y-2">
                    {group.instruments.map((instrument) => (
                      <li
                        key={instrument}
                        className="flex items-center gap-3 text-sm text-black/60"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-black/25" />
                        {instrument}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="border-t border-black/10 px-6 py-5 md:px-8">
              <p className="text-xs leading-5 text-black/35">
                Instrumentation can vary between editions and performances.
                Detailed orchestration information should be treated as
                indicative rather than definitive.
              </p>
            </div>
          </div>
        </div>
      )}

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
