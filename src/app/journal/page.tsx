import { Suspense } from "react";
import type { Metadata } from "next";
import JournalCard from "@/components/JournalCard";
import HandwrittenNote from "@/components/HandwrittenNote";
import { getPublishedJournalEntries } from "@/lib/journal/getJournalEntries";

export const metadata: Metadata = {
  title: "Journal",
};

async function JournalList() {
  const entries = await getPublishedJournalEntries();

  if (entries.length === 0) {
    return (
      <p className="mt-16 font-serif text-xl italic text-text-secondary">
        nothing here yet.
      </p>
    );
  }

  return (
    <div className="mt-6">
      {entries.map((entry, index) => (
        <JournalCard key={entry.id} entry={entry} index={index} />
      ))}
    </div>
  );
}

export default function JournalPage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 pb-24 pt-12 sm:px-8 sm:pt-16 lg:px-10">
      <header className="animate-fade-up max-w-lg">
        <h1 className="font-serif text-5xl tracking-[0.14em] sm:text-6xl">JOURNAL</h1>
        <p className="mt-5 font-serif text-2xl leading-snug text-text-secondary">
          some photos,
          <br />
          some thoughts.
        </p>
        <HandwrittenNote className="mt-8 text-muted">
          things i wanted to keep
        </HandwrittenNote>
      </header>
      <Suspense fallback={<div className="mt-16 h-40" aria-hidden="true" />}>
        <JournalList />
      </Suspense>
    </section>
  );
}
