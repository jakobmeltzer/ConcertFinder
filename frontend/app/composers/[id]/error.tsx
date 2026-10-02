"use client";
export default function DetailError() {
  return <main className="min-h-screen bg-[#f7f5f0] px-6 py-24 text-center text-[#202020]">
    <h1 className="text-3xl font-medium">Composer is temporarily unavailable</h1>
    <p className="mt-4 text-black/60">Please try again in a moment.</p>
    <button onClick={() => window.location.reload()} className="mt-6 underline underline-offset-4">Try again</button>
  </main>;
}
