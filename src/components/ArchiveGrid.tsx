"use client";

import type { Photo } from "@/types/photo";
import PhotoItem from "@/components/PhotoItem";

type ArchiveGridProps = {
  photos: Photo[];
  onSelect: (photo: Photo) => void;
};

const placements = [
  "md:col-span-5",
  "md:col-span-4 md:col-start-8 md:mt-20",
  "md:col-span-3 md:mt-2",
  "md:col-span-6 md:col-start-6 md:mt-14",
  "md:col-span-4 md:col-start-1 md:mt-8",
  "md:col-span-5 md:col-start-7 md:mt-28",
];

function scrapbookFor(photo: Photo) {
  if (photo.id === 11) return "tape" as const;
  if (photo.id === 4) return "print" as const;
  if (photo.id === 2) return "tilt" as const;
  return "none" as const;
}

export default function ArchiveGrid({ photos, onSelect }: ArchiveGridProps) {
  if (photos.length === 0) {
    return (
      <p className="py-16 font-serif text-xl text-muted">Nothing here yet.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-y-14 md:grid-cols-12 md:gap-x-8 md:gap-y-16">
      {photos.map((photo, index) => (
        <div
          key={photo.id}
          className={`min-w-0 ${placements[index % placements.length]} ${
            index > 0 && index % 6 === 0 ? "md:mt-24" : ""
          }`}
        >
          <PhotoItem
            photo={photo}
            showMeta
            scrapbook={scrapbookFor(photo)}
            onSelect={onSelect}
          />
        </div>
      ))}
    </div>
  );
}
