import Image from "next/image";
import Link from "next/link";
import type { JournalEntry } from "@/types/journal";
import { FEATURED_SIZES, getPhotoById, getPhotoDimensions } from "@/lib/photos";

type JournalCardProps = {
  entry: JournalEntry;
  index: number;
};

export default function JournalCard({ entry, index }: JournalCardProps) {
  const cover = getPhotoById(entry.photoIds[0]);
  const dimensions = cover
    ? getPhotoDimensions(cover)
    : { width: 2000, height: 1334 };
  const flipped = index % 2 === 1;

  return (
    <article
      className={`grid items-end gap-8 border-t border-line/90 py-16 lg:grid-cols-12 lg:gap-12 lg:py-20 ${
        flipped ? "" : ""
      }`}
    >
      <div
        className={`lg:col-span-7 ${flipped ? "lg:col-start-6 lg:row-start-1" : ""}`}
      >
        <Image
          src={entry.coverImage}
          alt={entry.title}
          width={dimensions.width}
          height={dimensions.height}
          quality={95}
          sizes={FEATURED_SIZES}
          className="h-auto w-full"
          style={{ height: "auto" }}
        />
      </div>
      <div
        className={`max-w-md lg:col-span-5 ${
          flipped ? "lg:col-start-1 lg:row-start-1 lg:pb-6" : "lg:pb-4"
        }`}
      >
        <p className="font-mono text-[11px] tracking-[0.18em] text-muted">
          {entry.date}
          {entry.location ? `  ·  ${entry.location}` : ""}
        </p>
        <h2 className="mt-4 font-serif text-3xl leading-tight tracking-wide sm:text-4xl">
          {entry.title}
        </h2>
        {entry.excerpt ? (
          <p className="mt-5 text-[15px] leading-relaxed text-text-secondary">
            {entry.excerpt}
          </p>
        ) : null}
        <Link
          href={`/journal/${entry.slug}`}
          className="mt-7 inline-block font-mono text-[11px] tracking-[0.2em] text-olive hover:text-text"
        >
          READ ENTRY →
        </Link>
      </div>
    </article>
  );
}
