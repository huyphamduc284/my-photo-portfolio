"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Photo } from "@/types/photo";
import { buildHomeArchive } from "@/lib/archive";
import ArchiveChronology from "@/components/ArchiveChronology";
import ChronologyTimeline from "@/components/ChronologyTimeline";
import Lightbox from "@/components/Lightbox";

type HomeArchiveProps = {
  photos: Photo[];
};

export default function HomeArchive({ photos }: HomeArchiveProps) {
  const months = useMemo(
    () => buildHomeArchive(photos, 12, 12, 12),
    [photos],
  );
  const visible = useMemo(() => months.flatMap((month) => month.photos), [months]);
  const [activeMonth, setActiveMonth] = useState<string | null>(months[0]?.anchor ?? null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const isProgrammaticScroll = useRef(false);
  const index = visible.findIndex((photo) => photo.id === activeId);

  const onSelect = useCallback((photo: Photo) => {
    setActiveId(photo.id);
  }, []);

  const onClose = useCallback(() => setActiveId(null), []);

  const onPrev = useCallback(() => {
    setActiveId((current) => {
      const currentIndex = visible.findIndex((photo) => photo.id === current);
      return visible[(currentIndex - 1 + visible.length) % visible.length]?.id ?? current;
    });
  }, [visible]);

  const onNext = useCallback(() => {
    setActiveId((current) => {
      const currentIndex = visible.findIndex((photo) => photo.id === current);
      return visible[(currentIndex + 1) % visible.length]?.id ?? current;
    });
  }, [visible]);

  const onActive = useCallback((id: string) => {
    if (isProgrammaticScroll.current) return;
    setActiveMonth(id);
  }, []);

  const onJump = useCallback((id: string) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    isProgrammaticScroll.current = true;
    setActiveMonth(id);
    document.getElementById(id)?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
    window.setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 900);
  }, []);

  return (
    <section>
      <header className="max-w-xl">
        <h2 className="font-serif text-2xl tracking-[0.16em] sm:text-3xl">THE ARCHIVE</h2>
        <p className="mt-3 font-serif text-xl text-text-secondary sm:text-2xl">
          a small record of recent days.
        </p>
      </header>

      <div className="mt-8">
        {months.length === 0 ? (
          <p className="font-serif text-xl italic text-text-secondary">nothing here yet.</p>
        ) : null}
        {months.length > 0 ? (
        <ChronologyTimeline
          months={months}
          activeId={activeMonth}
          onJump={onJump}
          variant="bar"
        />
        ) : null}
        {months.length > 0 ? (
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_8.75rem] lg:items-start lg:gap-12">
          <div>
            <ArchiveChronology
              months={months}
              forcedId={null}
              holding={false}
              onActive={onActive}
              onSelect={onSelect}
              sectionClassName="home-archive-month"
              renderAll
              showMonthLink
              activeLockedRef={isProgrammaticScroll}
            />
            <p className="border-t border-line/80 py-12">
              <Link
                href="/archive"
                className="font-mono text-[11px] tracking-[0.2em] text-olive hover:text-text"
              >
                VIEW FULL ARCHIVE →
              </Link>
            </p>
          </div>
          <ChronologyTimeline
            months={months}
            activeId={activeMonth}
            onJump={onJump}
            variant="rail"
            stickyClassName="top-[120px]"
          />
        </div>
        ) : (
          <p className="border-t border-line/80 py-12">
            <Link
              href="/archive"
              className="font-mono text-[11px] tracking-[0.2em] text-olive hover:text-text"
            >
              VIEW FULL ARCHIVE →
            </Link>
          </p>
        )}
      </div>

      {index >= 0 ? (
        <Lightbox
          photos={visible}
          index={index}
          onClose={onClose}
          onPrev={onPrev}
          onNext={onNext}
        />
      ) : null}
    </section>
  );
}
