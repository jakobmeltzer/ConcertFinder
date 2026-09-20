"use client";

import Link from "next/link";
import { motion } from "motion/react";

import { works } from "../data/works";
import { getConcertsForWork } from "../data/concerts";
import StaggeredContent from "../../components/StaggeredContent";
import { composerSlug } from "../../lib/composerSlug";

const composers = Array.from(
  new Map(
    works.map((work) => [
      work.composer,
      {
        id: composerSlug(work.composer),
        name: work.composer,
        period: work.period,
        workCount: works.filter((item) => item.composer === work.composer)
          .length,
        performanceCount: new Set(
          works
            .filter((item) => item.composer === work.composer)
            .flatMap((item) => getConcertsForWork(item.id).map((c) => c.id)),
        ).size,
      },
    ]),
  ).values(),
);

export default function ComposersPage() {
  return (
    <main className="min-h-screen bg-[#f7f5f0] text-[#202020]">


      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <StaggeredContent delay={0}>
          <section className="pb-16 pt-16 md:pb-20 md:pt-24">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/45">
              Composers
            </p>

            <h1 className="mt-5 text-5xl font-medium tracking-[-0.04em] md:text-7xl">
              Explore the composers
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-black/65">
              Open a composer to see their works and upcoming performances.
            </p>
          </section>
        </StaggeredContent>

        <div className="border-t border-black/10">
          {composers.map((composer, index) => (
            <motion.div
              key={composer.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.4,
                delay: index * 0.06,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Link
                href={`/composers/${composer.id}`}
                className="group block border-b border-black/10 py-7 transition-colors duration-300 hover:bg-black/[0.025] md:px-4"
              >
                <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <h2 className="text-2xl font-medium tracking-tight">
                      {composer.name}
                    </h2>

                    <p className="mt-2 text-sm text-black/45">
                      {composer.period} · {composer.workCount}{" "}
                      {composer.workCount === 1 ? "work" : "works"} ·{" "}
                      {composer.performanceCount}{" "}
                      {composer.performanceCount === 1
                        ? "upcoming performance"
                        : "upcoming performances"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-black/40 transition-colors group-hover:text-black">
                    View composer
                    <span className="transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <footer className="mt-20 border-t border-black/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-xs text-black/40 md:flex-row md:items-center md:justify-between md:px-10">
          <p>ConcertFinder</p>
          <p>Discover. Listen. Travel.</p>
        </div>
      </footer>
    </main>
  );
}
