"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Photo } from "@/types/photo";
import type { ArchiveFilter } from "@/lib/photos";
import { filterPhotos } from "@/lib/photos";
import { groupPhotosByMonth } from "@/lib/archive";
import ArchiveChronology from "@/components/ArchiveChronology";
import ChronologyTimeline from "@/components/ChronologyTimeline";
import Lightbox from "@/components/Lightbox";

const ARCHIVE_FILTERS: Array<{ id: ArchiveFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "places", label: "Places" },
  { id: "people", label: "People" },
  { id: "things", label: "Things" },
  { id: "random", label: "Random" },
  { id: "favorites", label: "Favorites" },
];

type ArchiveViewProps = {
  photos: Photo[];
  variant: "home" | "archive";
};

function isFilter(value: string | null): value is ArchiveFilter {
  return Boolean(
    value &&
      ["all", "places", "people", "things", "random", "favorites"].includes(value),
  );
}

export default function ArchiveView({ photos, variant }: ArchiveViewProps) {
  const searchParams = useSearchParams();
  const filters = ARCHIVE_FILTERS;
  const urlFilter = searchParams.get("filter");
  const filter: ArchiveFilter = isFilter(urlFilter) ? urlFilter : "all";

  const visible = useMemo(() => filterPhotos(photos, filter), [filter, photos]);
  const months = useMemo(
    () => (variant === "archive" ? groupPhotosByMonth(visible) : []),
    [variant, visible],
  );
  const [activeId, setActiveId] = useState<number | null>(null);
  const [activeMonth, setActiveMonth] = useState<string | null>(null);
  const [forcedMonth, setForcedMonth] = useState<string | null>(null);
  const [holding, setHolding] = useState(false);

  const skipReset = useRef(true);
  const pendingJump = useRef<string | null>(null);
  const isProgrammaticScroll = useRef(false);

  useEffect(() => {
    if (skipReset.current) {
      skipReset.current = false;
      setActiveMonth((current) => current ?? months[0]?.anchor ?? null);
      return;
    }

    setActiveId(null);
    setForcedMonth(null);
    setActiveMonth(months[0]?.anchor ?? null);
    sessionStorage.removeItem("archive-scroll");
  }, [filter, months]);

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

  const onActiveMonth = useCallback((id: string) => {
    if (isProgrammaticScroll.current) return;
    setActiveMonth(id);
    sessionStorage.setItem("archive-month", id);
  }, []);

  const onJump = useCallback((id: string) => {
    isProgrammaticScroll.current = true;
    pendingJump.current = id;
    setHolding(true);
    setForcedMonth(id);
    setActiveMonth(id);
    sessionStorage.setItem("archive-month", id);
  }, []);

  useEffect(() => {
    const id = pendingJump.current;
    if (!id || id !== forcedMonth) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const node = document.getElementById(id);
    if (!node) return;

    const align = (behavior: ScrollBehavior) => {
      document.getElementById(id)?.scrollIntoView({
        behavior,
        block: "start",
      });
    };

    align(reduce ? "auto" : "smooth");

    let released = false;
    let moved = reduce;
    let last = window.scrollY;
    let watch = 0;
    let fallback = 0;

    const release = () => {
      if (released) return;
      released = true;
      pendingJump.current = null;
      window.clearInterval(watch);
      window.clearTimeout(fallback);
      setHolding(false);
      window.setTimeout(() => {
        align("auto");
        isProgrammaticScroll.current = false;
      }, 140);
    };

    watch = window.setInterval(() => {
      const delta = Math.abs(window.scrollY - last);
      if (delta > 1) {
        moved = true;
        last = window.scrollY;
        return;
      }
      if (moved) release();
    }, 90);
    fallback = window.setTimeout(release, 2200);

    return () => {
      window.clearInterval(watch);
      window.clearTimeout(fallback);
    };
  }, [forcedMonth]);

  useEffect(() => {
    if (variant !== "archive") return;

    const savedMonth = sessionStorage.getItem("archive-month");
    const savedScroll = Number(sessionStorage.getItem("archive-scroll") || "0");
    if (savedMonth) setForcedMonth(savedMonth);

    const timer = window.setTimeout(() => {
      if (savedScroll > 80) {
        window.scrollTo({ top: savedScroll, behavior: "auto" });
      }
    }, 60);

    return () => window.clearTimeout(timer);
  }, [variant]);

  useEffect(() => {
    if (variant !== "archive") return;

    let frame = 0;
    const onScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        sessionStorage.setItem("archive-scroll", String(window.scrollY));
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.cancelAnimationFrame(frame);
    };
  }, [variant]);

  return (
    <section>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <ul className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Filter photographs">
          {filters.map((item) => {
            const active = item.id === filter;
            const className = `text-[12px] tracking-[0.14em] ${
              active
                ? "text-text underline decoration-olive/80 underline-offset-8"
                : "text-muted hover:text-text"
            }`;

            const href = item.id === "all" ? "/archive" : `/archive?filter=${item.id}`;
            return (
              <li key={item.id}>
                <Link href={href} scroll={false} className={className} aria-current={active ? "page" : undefined}>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      {variant === "archive" ? (
        <div className="mt-8">
          <ChronologyTimeline
            months={months}
            activeId={activeMonth}
            onJump={onJump}
            variant="bar"
          />
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_8.75rem] lg:items-start lg:gap-12">
            <ArchiveChronology
              months={months}
              forcedId={forcedMonth}
              holding={holding}
              onActive={onActiveMonth}
              onSelect={onSelect}
              activeLockedRef={isProgrammaticScroll}
            />
            <ChronologyTimeline
              months={months}
              activeId={activeMonth}
              onJump={onJump}
              variant="rail"
            />
          </div>
        </div>
      ) : null}
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
