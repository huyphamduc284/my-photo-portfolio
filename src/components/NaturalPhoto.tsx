"use client";

import Image from "next/image";
import { useEffect, useState, type SyntheticEvent } from "react";
import type { Photo } from "@/types/photo";
import { getPhotoAlt, getPhotoDimensions, getPhotoSrc } from "@/lib/photos";

type NaturalPhotoProps = {
  photo: Photo;
  sizes: string;
  quality?: number;
  preload?: boolean;
  loading?: "lazy" | "eager";
  className?: string;
  onReady?: () => void;
};

export default function NaturalPhoto({
  photo,
  sizes,
  quality = 95,
  preload,
  loading,
  className = "",
  onReady,
}: NaturalPhotoProps) {
  const initial = getPhotoDimensions(photo);
  const [ratio, setRatio] = useState(initial);

  useEffect(() => {
    setRatio(getPhotoDimensions(photo));
  }, [photo.height, photo.id, photo.orientation, photo.width]);

  function onLoad(event: SyntheticEvent<HTMLImageElement>) {
    const image = event.currentTarget;
    if (image.naturalWidth > 0 && image.naturalHeight > 0) {
      setRatio((current) => {
        const next = { width: image.naturalWidth, height: image.naturalHeight };
        const currentAspect = current.width / current.height;
        const nextAspect = next.width / next.height;
        if (Math.abs(currentAspect - nextAspect) < 0.008) return current;
        return next;
      });
    }
    onReady?.();
  }

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ aspectRatio: `${ratio.width} / ${ratio.height}` }}
    >
      <Image
        src={getPhotoSrc(photo)}
        alt={getPhotoAlt(photo)}
        fill
        preload={preload}
        loading={loading}
        quality={quality}
        sizes={sizes}
        className={`object-contain ${className}`}
        onLoad={onLoad}
      />
    </div>
  );
}
