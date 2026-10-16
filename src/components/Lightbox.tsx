"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { Photo } from "@/types/photo";
import { getPhotoAlt, getPhotoSrc, LIGHTBOX_SIZES } from "@/lib/photos";

type LightboxProps = {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};

export default function Lightbox({
  photos,
  index,
  onClose,
  onPrev,
  onNext,
}: LightboxProps) {
  const photo = photos[index];
  const onCloseRef = useRef(onClose);
  const onPrevRef = useRef(onPrev);
  const onNextRef = useRef(onNext);
  onCloseRef.current = onClose;
  onPrevRef.current = onPrev;
  onNextRef.current = onNext;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.documentElement.dataset.lightbox = "open";
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
      if (event.key === "ArrowLeft") onPrevRef.current();
      if (event.key === "ArrowRight") onNextRef.current();
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      delete document.documentElement.dataset.lightbox;
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  if (!photo || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex h-dvh w-screen flex-col bg-dark text-paper"
      role="dialog"
      aria-modal="true"
      aria-label="Photograph viewer"
      onClick={onClose}
    >
      <div
        className="flex items-center justify-between px-5 py-4 sm:px-8"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="font-mono text-[11px] tracking-[0.18em] text-paper/60">
          {photo.date}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="cursor-pointer font-mono text-[11px] tracking-[0.22em] text-paper/75 hover:text-paper"
        >
          close
        </button>
      </div>

      <div className="relative min-h-0 w-full flex-1">
        <div
          className="relative h-full w-full"
          onClick={(event) => event.stopPropagation()}
        >
          <Image
            src={getPhotoSrc(photo)}
            alt={getPhotoAlt(photo)}
            fill
            preload
            loading="eager"
            quality={100}
            sizes={LIGHTBOX_SIZES}
            className="object-contain p-6 md:p-10"
          />
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onPrev();
          }}
          aria-label="Previous photograph"
          className="absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 cursor-pointer font-mono text-sm tracking-[0.2em] text-paper/55 hover:text-paper sm:block"
        >
          previous
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onNext();
          }}
          aria-label="Next photograph"
          className="absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 cursor-pointer font-mono text-sm tracking-[0.2em] text-paper/55 hover:text-paper sm:block"
        >
          next
        </button>
      </div>

      <div
        className="flex items-end justify-between gap-4 px-5 py-5 sm:px-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="font-mono text-[11px] leading-relaxed tracking-[0.16em] text-paper/70">
          {photo.location ? <p>{photo.location}</p> : null}
          {photo.note ? <p>{photo.note}</p> : null}
        </div>
        <div className="flex gap-5 font-mono text-[11px] tracking-[0.16em] sm:hidden">
          <button
            type="button"
            onClick={onPrev}
            aria-label="Previous photograph"
            className="cursor-pointer"
          >
            previous
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label="Next photograph"
            className="cursor-pointer"
          >
            next
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
