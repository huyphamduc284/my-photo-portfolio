"use client";

import type { ArchiveMonth } from "@/lib/archive";
import { groupMonthsByYear } from "@/lib/archive";

type ChronologyTimelineProps = {
  months: ArchiveMonth[];
  activeId: string | null;
  onJump: (anchor: string) => void;
  variant: "bar" | "rail";
  stickyClassName?: string;
};

function MonthButton({
  month,
  active,
  onJump,
}: {
  month: ArchiveMonth;
  active: boolean;
  onJump: (anchor: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onJump(month.anchor)}
      aria-current={active ? "true" : undefined}
      className={`flex w-full items-center justify-between gap-3 text-left font-mono text-[10px] tracking-[0.16em] transition-colors ${
        active ? "text-text" : "text-muted hover:text-text"
      }`}
    >
      <span className="flex items-center gap-2">
        <span className="inline-block w-3 text-olive" aria-hidden="true">
          {active ? "●" : "○"}
        </span>
        {month.short}
      </span>
      <span className={active ? "text-text-secondary" : "text-muted"}>{month.photos.length}</span>
    </button>
  );
}

export default function ChronologyTimeline({
  months,
  activeId,
  onJump,
  variant,
  stickyClassName = "top-28",
}: ChronologyTimelineProps) {
  const years = groupMonthsByYear(months);

  if (months.length === 0) return null;

  if (variant === "bar") {
    return (
      <div className="sticky top-[4.6rem] z-30 -mx-5 border-b border-line/80 bg-background/95 px-5 py-3 lg:hidden">
        <p className="font-mono text-[9px] tracking-[0.18em] text-muted">Jump to date</p>
        <ul className="mt-2 flex gap-4 overflow-x-auto pb-1">
          {years.map((year) => (
            <li key={year.year} className="flex shrink-0 items-center gap-3">
              <span className="font-mono text-[10px] tracking-[0.16em] text-text-secondary">
                {year.year}
              </span>
              {year.months.map((month) => (
                <button
                  key={month.anchor}
                  type="button"
                  onClick={() => onJump(month.anchor)}
                  aria-current={month.anchor === activeId ? "true" : undefined}
                  className={`font-mono text-[10px] tracking-[0.16em] ${
                    month.anchor === activeId ? "text-olive" : "text-muted"
                  }`}
                >
                  {month.short}
                </button>
              ))}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <nav
      aria-label="Jump to date"
      className={`sticky hidden max-h-[70vh] overflow-y-auto lg:block ${stickyClassName}`}
    >
      <ul className="space-y-6">
        {years.map((year) => (
          <li key={year.year}>
            <p className="font-mono text-[10px] tracking-[0.2em] text-text-secondary">{year.year}</p>
            <ul className="mt-3 border-l border-line pl-3">
              {year.months.map((month) => (
                <li key={month.anchor} className="py-1.5">
                  <MonthButton
                    month={month}
                    active={month.anchor === activeId}
                    onJump={onJump}
                  />
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  );
}
