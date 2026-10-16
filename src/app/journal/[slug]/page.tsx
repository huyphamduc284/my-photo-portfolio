import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getPublishedJournalSlugs,
} from "@/lib/journal/getJournalEntries";
import { getPublishedJournalEntryBySlug } from "@/lib/journal/getJournalEntryBySlug";
import { formatPhotoDate } from "@/lib/archive";
import JournalGallery from "@/components/JournalGallery";

type JournalEntryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const slugs = await getPublishedJournalSlugs();
  if (slugs.length === 0) {
    return [{ slug: "_" }];
  }
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: JournalEntryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getPublishedJournalEntryBySlug(slug);
  if (!entry) return { title: "Journal" };
  return { title: entry.title };
}

async function JournalEntryContent({ params }: JournalEntryPageProps) {
  const { slug } = await params;
  const entry = await getPublishedJournalEntryBySlug(slug);

  if (!entry) notFound();

  const paragraphs = (entry.body ?? "").split("\n\n").filter(Boolean);

  return (
    <article className="mx-auto w-full max-w-5xl px-5 pb-24 pt-12 sm:px-8 sm:pt-16 lg:px-10">
      <p className="font-mono text-[11px] tracking-[0.18em] text-muted">
        {formatPhotoDate(entry.date)}
        {entry.location ? (
          <>
            <br />
            {entry.location}
          </>
        ) : null}
      </p>
      <h1 className="mt-6 max-w-xl font-serif text-4xl leading-tight tracking-wide sm:text-5xl">
        {entry.title}
      </h1>
      <div className="mt-8 max-w-md space-y-4 text-[16px] leading-relaxed text-text-secondary">
        {entry.excerpt ? <p>{entry.excerpt}</p> : null}
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <JournalGallery photos={entry.photos} />
      <p className="mt-20">
        <Link
          href="/journal"
          className="font-mono text-[11px] tracking-[0.2em] text-muted hover:text-text"
        >
          ← JOURNAL
        </Link>
      </p>
    </article>
  );
}

export default function JournalEntryPage(props: JournalEntryPageProps) {
  return (
    <Suspense fallback={null}>
      <JournalEntryContent {...props} />
    </Suspense>
  );
}
