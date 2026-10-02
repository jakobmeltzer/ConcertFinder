import Link from "next/link";
export default function ComposerNotFound() {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f0] px-6">
        <div className="text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-black/40">
            ConcertFinder
          </p>

          <h1 className="text-3xl font-medium tracking-tight">
            Composer not found
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
