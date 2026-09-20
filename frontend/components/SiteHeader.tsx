"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/works", label: "Works" },
  { href: "/composers", label: "Composers" },
  { href: "/cities", label: "Cities" },
];

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-black/10 bg-[#f7f5f0] text-[#202020]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-4 px-6 py-5 md:px-10">
        <Link
          href="/"
          className="site-logo flex items-center gap-2 text-lg font-medium tracking-tight"
        >
          <span
            aria-hidden="true"
            className="site-logo-note"
          >
            ♫
          </span>
          ConcertFinder
        </Link>
        <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-6 text-sm">
          {links.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`transition-colors hover:text-black ${active ? "text-black" : "text-black/60"}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
