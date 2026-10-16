"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Photo } from "@/types/photo";
import {
  ARCHIVE_SIZES,
  getPhotoAlt,
  getPhotoDimensions,
  getPhotoSrc,
} from "@/lib/photos";

type PhotoItemProps = {
  photo: Photo;
  showMeta?: boolean;
  scrapbook?: "print" | "tilt" | "tape" | "none";
  sizes?: string;
  onSelect?: (photo: Photo) => void;
};

export default function PhotoItem({
  photo,
  showMeta = true,
  scrapbook = "none",
  sizes = ARCHIVE_SIZES,
  onSelect,
}: PhotoItemProps) {
  const { width, height } = getPhotoDimensions(photo);
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [near, setNear] = useState(false);
  const [shown, setShown] = useState(false);
  const frameClass =
    scrapbook === "print"
      ? "photo-print"
      : scrapbook === "tape"
        ? "photo-tape"
        : "";
  const tiltClass = scrapbook === "tilt" ? "origin-center -rotate-1" : "";

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth > 0) {
      setShown(true);
    }
  }, [near]);

  return (
    <figure className={`group ${tiltClass}`}>
      <div className={frameClass}>
        <button
          type="button"
          onClick={() => onSelect?.(photo)}
          aria-label={`Open photograph from ${photo.location ?? photo.date}`}
          className="block w-full cursor-pointer overflow-hidden text-left"
        >
          <div
            ref={frameRef}
            className="relative w-full bg-background-warm"
            style={{ aspectRatio: `${width} / ${height}` }}
          >
            {near ? (
              <Image
                ref={imageRef}
                src={getPhotoSrc(photo)}
                alt={getPhotoAlt(photo)}
                fill
                loading="lazy"
                quality={95}
                sizes={sizes}
                className={`cursor-pointer object-contain archive-photo ${shown ? "is-shown" : ""}`}
                onLoad={() => setShown(true)}
              />
            ) : null}
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
