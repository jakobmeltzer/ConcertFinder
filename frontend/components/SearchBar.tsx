"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export type SearchWork = {
  id: string;
  title: string;
  composer: string;
  period?: string;
};

export type SearchComposer = {
  id: string;
  name: string;
};

export type SearchConcert = {
  id: string;
  work: string;
  composer: string;
  orchestra: string;
  city: string;
  dateLabel: string;
};

type SearchBarProps = {
  works?: SearchWork[];
  composers?: SearchComposer[];
  concerts?: SearchConcert[];
  placeholder?: string;
  value?: string;
  suggestedQueries?: string[];
  onQueryChange?: (query: string) => void;
  className?: string;
};

export default function SearchBar({
  works = [],
  composers = [],
  concerts = [],
  placeholder = "Search...",
  onQueryChange,
  value,
  suggestedQueries = [],
  className = "",
}: SearchBarProps) {
  const [internalQuery, setQuery] = useState("");
  const query = value ?? internalQuery;
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setFocused(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredWorks = useMemo(() => {
    if (!normalizedQuery) {
      return works.slice(0, 4);
    }

    return works
      .filter(
        (work) =>
          work.title.toLowerCase().includes(normalizedQuery) ||
          work.composer.toLowerCase().includes(normalizedQuery) ||
          work.period?.toLowerCase().includes(normalizedQuery),
      )
      .slice(0, 4);
  }, [works, normalizedQuery]);

  const filteredComposers = useMemo(() => {
    if (!normalizedQuery) {
      return composers.slice(0, 3);
    }

    return composers
      .filter((composer) =>
        composer.name.toLowerCase().includes(normalizedQuery),
      )
      .slice(0, 3);
  }, [composers, normalizedQuery]);

  const filteredConcerts = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    return concerts
      .filter(
        (concert) =>
          concert.work.toLowerCase().includes(normalizedQuery) ||
          concert.composer.toLowerCase().includes(normalizedQuery) ||
          concert.orchestra.toLowerCase().includes(normalizedQuery) ||
          concert.city.toLowerCase().includes(normalizedQuery),
      )
      .slice(0, 4);
  }, [concerts, normalizedQuery]);

  const hasResults =
    filteredWorks.length > 0 ||
    filteredComposers.length > 0 ||
    filteredConcerts.length > 0;

  const showDropdown = focused;

  const updateQuery = (value: string) => {
    setQuery(value);
    onQueryChange?.(value);
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
      {/* Search input */}
      <div
        className={`relative flex items-center rounded-2xl border bg-white shadow-[0_8px_40px_rgba(0,0,0,0.04)] transition-all duration-300 ${
          focused
            ? "scale-[1.01] border-[#aaa69e] shadow-[0_12px_50px_rgba(0,0,0,0.08)]"
            : "border-[#dedbd4]"
        }`}
      >
        <motion.span
          className="ml-5 mr-3 text-xl text-[#77736b]"
          animate={{
            scale: focused ? 1.08 : 1,
            rotate: focused ? -8 : 0,
          }}
          transition={{
            duration: 0.2,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          ⌕
        </motion.span>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          className="h-16 flex-1 bg-transparent pr-3 text-[15px] outline-none placeholder:text-[#aaa69e]"
          aria-label={placeholder}
          aria-expanded={showDropdown}
          aria-autocomplete="list"
        />

        <AnimatePresence>
          {query && (
            <motion.button
              type="button"
              initial={{
                opacity: 0,
                scale: 0.7,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.7,
              }}
              transition={{
                duration: 0.15,
              }}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => updateQuery("")}
              className="mr-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm text-[#999] transition-colors hover:bg-[#eee] hover:text-[#333]"
              aria-label="Clear search"
            >
              ×
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{
              opacity: 0,
              y: -6,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -6,
              scale: 0.98,
            }}
            transition={{
              duration: 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="absolute left-0 right-0 top-[calc(100%+10px)] z-30 overflow-hidden rounded-2xl border border-[#dedbd4] bg-white p-2 shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
          >
            {!hasResults ? (
              <div className="px-4 py-8 text-center text-sm text-[#85817a]">
                No results found.
              </div>
            ) : (
              <div>
                {/* Works */}
                {filteredWorks.length > 0 && (
                  <SearchSection title="Works">
                    {filteredWorks.map((work, index) => (
                      <SearchResult
                        key={`work-${work.id}`}
                        href={`/works/${work.id}`}
                        title={work.title}
                        subtitle={work.composer}
                        type="Work"
                        index={index}
                        onClick={() => setFocused(false)}
                      />
                    ))}
                  </SearchSection>
                )}

                {/* Composers */}
                {filteredComposers.length > 0 && (
                  <SearchSection title="Composers">
                    {filteredComposers.map((composer, index) => (
                      <SearchResult
                        key={`composer-${composer.id}`}
                        href={`/composers/${composer.id}`}
                        title={composer.name}
                        subtitle="Composer"
                        type="Composer"
                        index={index}
                        onClick={() => setFocused(false)}
                      />
                    ))}
                  </SearchSection>
                )}

                {/* Concerts */}
                {filteredConcerts.length > 0 && (
                  <SearchSection title="Upcoming performances">
                    {filteredConcerts.map((concert, index) => (
                      <SearchResult
                        key={`concert-${concert.id}`}
                        href={`/concerts/${concert.id}`}
                        title={`${concert.composer} — ${concert.work}`}
                        subtitle={`${concert.orchestra} · ${concert.city} · ${concert.dateLabel}`}
                        type="Concert"
                        index={index}
                        onClick={() => setFocused(false)}
                      />
                    ))}
                  </SearchSection>
                )}

                {/* Everything */}
                {normalizedQuery && (
                  <div className="mt-1 border-t border-[#eeeae3] px-3 py-3">
                    <button
                      type="button"
                      className="text-xs text-[#77736b] transition-colors hover:text-[#202020]"
                    >
                      Search everything for “{query}” →
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      </div>
      {suggestedQueries.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-[#aaa69e]">
          <span>Try</span>
          {suggestedQueries.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                updateQuery(suggestion);
                inputRef.current?.focus();
              }}
              className="underline decoration-[#d0ccc4] underline-offset-4 transition-colors hover:text-[#444]"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SearchSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2 last:mb-0">
      <div className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-[0.15em] text-[#aaa69e]">
        {title}
      </div>

      {children}
    </div>
  );
}

function SearchResult({
  href,
  title,
  subtitle,
  type,
  index,
  onClick,
}: {
  href: string;
  title: string;
  subtitle: string;
  type: string;
  index: number;
  onClick: () => void;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 5,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.2,
        delay: index * 0.035,
      }}
    >
      <Link
        href={href}
        onClick={onClick}
        className="group flex items-center justify-between rounded-xl px-3 py-3 transition-colors duration-150 hover:bg-[#f5f3ee]"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{title}</p>

          <p className="mt-1 truncate text-xs text-[#8a877f]">{subtitle}</p>
        </div>

        <div className="ml-4 flex shrink-0 items-center gap-3">
          <span className="text-[10px] uppercase tracking-wider text-[#aaa69e]">
            {type}
          </span>

          <span className="translate-x-[-4px] text-[#aaa69e] opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
            →
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
