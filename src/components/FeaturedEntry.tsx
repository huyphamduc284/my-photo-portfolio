import Link from "next/link";
import type { JournalEntry } from "@/types/journal";
import type { Photo } from "@/types/photo";
import { formatPhotoDate } from "@/lib/archive";
import NaturalPhoto from "@/components/NaturalPhoto";
import { FEATURED_SIZES, featuredPhotoFrameClass } from "@/lib/photos";

type FeaturedEntryProps = {
  entry?: JournalEntry | null;
  photo: Photo | null;
};

export default function FeaturedEntry({ entry, photo }: FeaturedEntryProps) {
  if (!photo && !entry) {
    return (
      <p className="font-serif text-xl italic text-text-secondary">nothing here yet.</p>
    );
  }

  const title = entry?.title ?? photo?.location ?? "a photograph";
  const [titleLead, ...titleRest] = title.split(" in ");
  const date = entry?.date ?? photo?.date ?? "";
  const location = entry?.location;

  return (
    <article>
      {photo ? (
        <div className={featuredPhotoFrameClass(photo)}>
          <NaturalPhoto
            photo={photo}
            sizes={FEATURED_SIZES}
            quality={95}
            preload
            loading="eager"
          />
        </div>
      ) : null}
      <p className="mt-4 font-mono text-[10px] tracking-[0.16em] text-muted/80">
        {formatPhotoDate(date)}
        {location ? `  ·  ${location}` : ""}
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
      {entry?.excerpt ? (
        <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-text-secondary">
          {entry.excerpt}
        </p>
      ) : photo?.note ? (
        <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-text-secondary">
          {photo.note}
        </p>
      ) : null}
      {entry ? (
        <Link
          href={`/journal/${entry.slug}`}
          className="mt-6 inline-block font-mono text-[11px] tracking-[0.2em] text-olive transition-colors hover:text-text"
        >
          READ ENTRY →
        </Link>
      ) : null}
    </article>
  );
}
