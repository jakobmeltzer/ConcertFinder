"use client";

import Link from "next/link";
import { motion } from "motion/react";

import StaggeredContent from "../../../components/StaggeredContent";

import type { ComposerDetailResponse } from "../../../lib/api/types";
import { formatConcertDate } from "../../../lib/concert-date";

export default function ComposerDetail({ composer, today }: { composer: ComposerDetailResponse; today: string }) {
  const composerWorks = composer.works;
  const performances = composer.performances.filter((performance) => performance.date >= today);
  return (
    <main className="min-h-screen bg-[#f7f5f0] text-[#202020]">


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
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/45">
                Composer
              </p>

              <h1 className="mt-5 text-5xl font-medium tracking-[-0.04em] md:text-7xl lg:text-8xl">
                {composer.name}
              </h1>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-black/50">
                {composer.period && <><span>{composer.period}</span><span>·</span></>}
                {(composer.birth_year !== null || composer.death_year !== null) && (
                  <><span>{composer.birth_year !== null ? `Born ${composer.birth_year}` : ""}{composer.death_year !== null ? `${composer.birth_year !== null ? " · " : ""}Died ${composer.death_year}` : ""}</span><span>·</span></>
                )}

                <span>
                  {composerWorks.length}{" "}
                  {composerWorks.length === 1 ? "work" : "works"}
                </span>

                <span>·</span>

                <span>
                  {performances.length}{" "}
                  {performances.length === 1
                    ? "upcoming performance"
                    : "upcoming performances"}
                </span>
              </div>

              <p className="mt-10 max-w-2xl text-lg leading-8 text-black/65 md:text-xl md:leading-9">
                {composer.description ?? `Explore the works of ${composer.name} and discover upcoming performances.`}
              </p>
            </div>
          </section>
        </StaggeredContent>

        <div className="h-px bg-black/10" />

        {/* Works */}
        <section className="py-20 md:py-28">
          <StaggeredContent delay={0.05}>
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                  Works
                </p>

                <h2 className="mt-4 text-4xl font-medium tracking-tight md:text-5xl">
                  Explore the music
                </h2>
              </div>

              <span className="hidden text-sm text-black/35 md:block">
                {composerWorks.length}{" "}
                {composerWorks.length === 1 ? "work" : "works"}
              </span>
            </div>
          </StaggeredContent>

          {composerWorks.length === 0 && <p className="mt-12 text-sm text-black/40">No works found.</p>}
          <div className="mt-12 border-t border-black/10">
            {composerWorks.map((work, index) => (
              <motion.div
                key={work.id}
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
                  href={`/works/${work.id}`}
                  className="inverse-hover group block border-b border-black/10 py-7 transition-colors duration-300 hover:bg-black/[0.025] md:px-4"
                >
                  <div className="grid gap-5 md:grid-cols-[100px_1fr_auto] md:items-center">
                    <div>
                      <p className="text-sm font-medium">{work.year}</p>

                      <p className="mt-1 text-xs text-black/40">
                        {work.duration}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xl font-medium tracking-tight md:text-2xl">
                        {work.title}
                      </h3>

                      {work.subtitle && (
                        <p className="mt-1 text-sm italic text-black/40">
                          {work.subtitle}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-black/40 transition-colors group-hover:text-black">
                      View work
                      <span className="transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Upcoming performances */}
        <section className="border-y border-black/10 py-20 md:py-28">
          <StaggeredContent delay={0.05}>
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
              {performances.map((performance, index) => (
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
                          {formatConcertDate(performance.date)}
                        </p>

                        <p className="mt-1 text-xs text-black/40">
                          {performance.time.slice(0, 5)}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium">
                          {performance.orchestra?.name}
                        </h3>

                        {performance.conductor && (
                          <p className="mt-1 text-sm text-black/50">
                            {performance.conductor.name} · {performance.venue?.name}
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
