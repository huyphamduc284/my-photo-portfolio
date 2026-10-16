"use client";

import { useEffect, useRef, useState } from "react";
import type { Photo } from "@/types/photo";
import { ARCHIVE_SIZES } from "@/lib/photos";
import NaturalPhoto from "@/components/NaturalPhoto";

type PhotoItemProps = {
  photo: Photo;
  showMeta?: boolean;
  scrapbook?: "print" | "tilt" | "tape" | "none";
  sizes?: string;
  quality?: number;
  eager?: boolean;
  onSelect?: (photo: Photo) => void;
};

export default function PhotoItem({
  photo,
  showMeta = true,
  scrapbook = "none",
  sizes = ARCHIVE_SIZES,
  quality = 95,
  eager = false,
  onSelect,
}: PhotoItemProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(eager);
  const [shown, setShown] = useState(false);
  const frameClass =
    scrapbook === "print"
      ? "photo-print"
      : scrapbook === "tape"
        ? "photo-tape"
        : "";
  const tiltClass = scrapbook === "tilt" ? "origin-center -rotate-1" : "";

  useEffect(() => {
    if (eager) return;
    const node = frameRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin: "400px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [eager]);

  return (
    <figure className={`group ${tiltClass}`}>
      <div className={frameClass}>
        <button
          type="button"
          onClick={() => onSelect?.(photo)}
          aria-label={`Open photograph from ${photo.location ?? photo.date}`}
          className="block w-full cursor-pointer overflow-hidden text-left"
        >
          <div ref={frameRef}>
            {near ? (
              <NaturalPhoto
                photo={photo}
                sizes={sizes}
                quality={quality}
                preload={eager}
                loading={eager ? "eager" : "lazy"}
                className={`cursor-pointer archive-photo ${shown ? "is-shown" : ""}`}
                onReady={() => setShown(true)}
              />
            ) : (
              <div
                className="w-full"
                style={{
                  aspectRatio: photo.width && photo.height
                    ? `${photo.width} / ${photo.height}`
                    : photo.orientation === "portrait"
                      ? "2 / 3"
                      : photo.orientation === "landscape"
                        ? "3 / 2"
                        : "2 / 3",
                }}
              />
            )}
          </div>
        </button>
      </div>
      {showMeta ? (
        <figcaption className="mt-2.5 space-y-px font-mono text-[9px] leading-[1.55] tracking-[0.16em] text-muted/75">
          <p>{photo.date}</p>
          {photo.location ? <p>{photo.location}</p> : null}
          {photo.note ? <p>{photo.note}</p> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
