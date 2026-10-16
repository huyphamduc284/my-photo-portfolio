"use client";

import { useCallback, useState } from "react";
import type { Photo } from "@/types/photo";
import PhotoItem from "@/components/PhotoItem";
import Lightbox from "@/components/Lightbox";
import HandwrittenNote from "@/components/HandwrittenNote";
import { FEATURED_SIZES } from "@/lib/photos";

type JournalGalleryProps = {
  photos: Photo[];
};

export default function JournalGallery({ photos }: JournalGalleryProps) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const index = photos.findIndex((photo) => photo.id === activeId);

  const onSelect = useCallback((photo: Photo) => {
    setActiveId(photo.id);
  }, []);

  const onClose = useCallback(() => setActiveId(null), []);

  const onPrev = useCallback(() => {
    setActiveId((current) => {
      const currentIndex = photos.findIndex((photo) => photo.id === current);
      return photos[(currentIndex - 1 + photos.length) % photos.length]?.id ?? current;
    });
  }, [photos]);

  const onNext = useCallback(() => {
    setActiveId((current) => {
      const currentIndex = photos.findIndex((photo) => photo.id === current);
      return photos[(currentIndex + 1) % photos.length]?.id ?? current;
    });
  }, [photos]);

  const [first, ...rest] = photos;

  return (
    <>
      {first ? (
        <div className="mt-12">
          <PhotoItem
            photo={first}
            showMeta={false}
            sizes="100vw"
            onSelect={onSelect}
          />
        </div>
      ) : null}

      {rest.length > 0 ? (
        <>
          <div className="my-14 flex justify-end">
            <HandwrittenNote className="max-w-[10rem] text-right text-muted">
              still think about
              this place →
            </HandwrittenNote>
          </div>
          <div className="grid gap-8 md:grid-cols-2 md:items-end md:gap-10">
            {rest.slice(0, 2).map((photo) => (
              <PhotoItem
                key={photo.id}
                photo={photo}
                sizes={FEATURED_SIZES}
                scrapbook={photo.orientation === "portrait" ? "print" : "none"}
                onSelect={onSelect}
              />
            ))}
          </div>
        </>
      ) : null}

      {rest.slice(2).map((photo) => (
        <div key={photo.id} className="mt-16">
          <PhotoItem photo={photo} sizes="100vw" onSelect={onSelect} />
        </div>
      ))}

      {index >= 0 ? (
        <Lightbox
          photos={photos}
          index={index}
          onClose={onClose}
          onPrev={onPrev}
          onNext={onNext}
        />
      ) : null}
    </>
  );
}
