import Image from "next/image";
import Link from "next/link";
import type { JournalEntry } from "@/types/journal";
import { getPhotoById, getPhotoDimensions } from "@/lib/photos";

type FeaturedEntryProps = {
  entry: JournalEntry;
};

export default function FeaturedEntry({ entry }: FeaturedEntryProps) {
  const cover = getPhotoById(entry.photoIds[0]);
  const dimensions = cover
    ? getPhotoDimensions(cover)
    : { width: 2000, height: 1334 };

  const [titleLead, ...titleRest] = entry.title.split(" in ");

  return (
    <article>
      <Image
        src={entry.coverImage}
        alt={entry.title}
        width={dimensions.width}
        height={dimensions.height}
        preload
        loading="eager"
        quality={95}
        sizes="(max-width: 768px) 100vw, 62vw"
        className="h-auto w-full"
        style={{ height: "auto" }}
      />
      <p className="mt-4 font-mono text-[10px] tracking-[0.16em] text-muted/80">
        {entry.date}
      </p>
      <h2 className="mt-3 font-serif text-3xl leading-tight tracking-wide sm:text-[2rem]">
        {titleLead}
        {titleRest.length > 0 ? (
          <>
            <br />
            in {titleRest.join(" in ")}
          </>
        ) : null}
      </h2>
      {entry.excerpt ? (
        <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-text-secondary">
          {entry.excerpt}
        </p>
      ) : null}
      {entry.body ? (
        <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-text-secondary">
          {entry.body.split("\n\n")[0]}
        </p>
      ) : null}
      <Link
        href={`/journal/${entry.slug}`}
        className="mt-6 inline-block font-mono text-[11px] tracking-[0.2em] text-olive transition-colors hover:text-text"
      >
        READ ENTRY →
      </Link>
    </article>
  );
}
