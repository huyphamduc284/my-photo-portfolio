"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import Link from "next/link";
import type { Photo } from "@/types/photo";
import type { ArchiveMonth } from "@/lib/archive";
import PhotoItem from "@/components/PhotoItem";

const BATCH = 8;
const WIDTHS = [
  "md:w-[82%]",
  "md:ml-[10%] md:w-[48%]",
  "md:ml-auto md:w-[70%]",
  "md:w-[58%]",
];

type ArchiveChronologyProps = {
  months: ArchiveMonth[];
  forcedId: string | null;
  holding: boolean;
  onActive: (id: string) => void;
  onSelect: (photo: Photo) => void;
  sectionClassName?: string;
  renderAll?: boolean;
  showMonthLink?: boolean;
  activeLockedRef?: MutableRefObject<boolean>;
};

function scrapbookFor(photo: Photo) {
  if (photo.id === 11) return "tape" as const;
  if (photo.id === 4) return "print" as const;
  if (photo.id === 2) return "tilt" as const;
  return "none" as const;
}

function MonthSection({
  month,
  forced,
  holding,
  initialCount,
  sectionClassName,
  showMonthLink,
  onSelect,
}: {
  month: ArchiveMonth;
  forced: boolean;
  holding: boolean;
  initialCount: number;
  sectionClassName: string;
  showMonthLink: boolean;
  onSelect: (photo: Photo) => void;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    if (forced) {
      setCount(month.photos.length);
    }
  }, [forced, month.photos.length]);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setCount((current) => Math.max(current, Math.min(BATCH, month.photos.length)));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (holding && !forced) return;
        if (!entry?.isIntersecting) return;
        setCount((current) => Math.max(current, Math.min(BATCH, month.photos.length)));
      },
      { rootMargin: "500px 0px", threshold: 0.01 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [forced, holding, month.photos.length]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || count === 0 || count >= month.photos.length) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setCount((current) => Math.min(month.photos.length, current + BATCH));
      },
      { rootMargin: "400px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [count, month.photos.length]);

  const visible = month.photos.slice(0, count);
  const countLabel = `${month.photos.length} photograph${month.photos.length === 1 ? "" : "s"}`;

  return (
    <section
      ref={sectionRef}
      id={month.anchor}
      data-month-id={month.anchor}
      data-chronology-month
      className={`${sectionClassName} border-t border-line/80 py-14`}
    >
      <header className="mb-10">
        <h2 className="font-serif text-2xl tracking-[0.16em] sm:text-3xl">{month.label}</h2>
        <p className="mt-2 font-mono text-[10px] tracking-[0.16em] text-muted">{countLabel}</p>
      </header>
      <div className="flex flex-col gap-14 md:gap-20">
        {visible.map((photo, index) => (
          <div key={photo.id} className={`w-full ${WIDTHS[index % WIDTHS.length]}`}>
            <PhotoItem
              photo={photo}
              showMeta
              scrapbook={scrapbookFor(photo)}
              onSelect={onSelect}
            />
          </div>
        ))}
      </div>
      {count < month.photos.length ? (
        <div ref={sentinelRef} className="h-8" aria-hidden="true" />
      ) : null}
      {showMonthLink && month.total > month.photos.length ? (
        <p className="mt-10">
          <Link
            href={`/archive#${month.id}`}
            className="font-mono text-[11px] tracking-[0.18em] text-olive hover:text-text"
          >
            VIEW {month.label.split(" ")[0]} →
          </Link>
        </p>
      ) : null}
    </section>
  );
}

export default function ArchiveChronology({
  months,
  forcedId,
  holding,
  onActive,
  onSelect,
  sectionClassName = "archive-month",
  renderAll = false,
  showMonthLink = false,
  activeLockedRef,
}: ArchiveChronologyProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nodes = rootRef.current?.querySelectorAll<HTMLElement>("[data-chronology-month]");
    if (!nodes || nodes.length === 0) return;

    if (typeof IntersectionObserver === "undefined") {
      const first = nodes[0];
      if (first) onActive(first.id);
      return;
    }

    const visible = new Map<string, IntersectionObserverEntry>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.set(entry.target.id, entry);
          } else {
            visible.delete(entry.target.id);
          }
        }

        if (activeLockedRef?.current) return;

        const visibleEntries = [...visible.values()];
        if (visibleEntries.length === 0) return;

        const line = window.innerHeight * 0.35;
        const closest = visibleEntries.sort(
          (a, b) =>
            Math.abs(a.boundingClientRect.top - line) -
            Math.abs(b.boundingClientRect.top - line),
        )[0];

        if (closest) onActive(closest.target.id);
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: [0, 0.1, 0.25] },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [activeLockedRef, months, onActive]);

  if (months.length === 0) {
    return <p className="py-16 font-serif text-xl text-muted">Nothing here yet.</p>;
  }

  return (
    <div ref={rootRef}>
      {months.map((month, index) => (
        <MonthSection
          key={month.anchor}
          month={month}
          forced={forcedId === month.anchor}
          holding={holding}
          initialCount={
            renderAll
              ? month.photos.length
              : index === 0
                ? Math.min(BATCH, month.photos.length)
                : 0
          }
          sectionClassName={sectionClassName}
          showMonthLink={showMonthLink}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
