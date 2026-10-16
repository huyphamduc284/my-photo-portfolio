import type { Photo } from "@/types/photo";

const MONTHS = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
] as const;

export type ArchiveMonth = {
  id: string;
  anchor: string;
  year: number;
  month: number;
  label: string;
  short: string;
  photos: Photo[];
  total: number;
};

export type ParsedDate = {
  year: number;
  month: number;
  day: number;
};

export function parseArchiveDate(date: string): ParsedDate | null {
  const value = date.trim();
  const dotted = /^(\d{1,2})\.(\d{1,2})\.(\d{2})$/.exec(value);
  if (dotted) {
    const day = Number(dotted[1]);
    const month = Number(dotted[2]);
    const year = 2000 + Number(dotted[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return { year, month, day };
  }

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!iso) return null;

  const year = Number(iso[1]);
  const month = Number(iso[2]);
  const day = Number(iso[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  return { year, month, day };
}

export function formatPhotoDate(date: string): string {
  const parsed = parseArchiveDate(date);
  if (!parsed) return date;
  return `${String(parsed.day).padStart(2, "0")}.${String(parsed.month).padStart(2, "0")}.${String(parsed.year).slice(-2)}`;
}

export function groupPhotosByMonth(photos: Photo[]): ArchiveMonth[] {
  const groups = new Map<string, ArchiveMonth>();

  for (const photo of photos) {
    const parsed = parseArchiveDate(photo.date);
    const year = parsed?.year ?? 0;
    const month = parsed?.month ?? 0;
    const id = parsed ? `${year}-${String(month).padStart(2, "0")}` : "undated";
    const existing = groups.get(id);

    if (existing) {
      existing.photos.push(photo);
      continue;
    }

    groups.set(id, {
      id,
      anchor: id,
      year,
      month,
      label: parsed ? `${MONTHS[month - 1]} ${year}` : "UNDATED",
      short: parsed ? MONTHS[month - 1].slice(0, 3) : "—",
      photos: [photo],
      total: 0,
    });
  }

  return [...groups.values()]
    .map((group) => {
      const photos = [...group.photos].sort((a, b) => {
        const aDay = parseArchiveDate(a.date)?.day ?? 0;
        const bDay = parseArchiveDate(b.date)?.day ?? 0;
        return bDay - aDay;
      });

      return {
        ...group,
        photos,
        total: photos.length,
      };
    })
    .sort((a, b) => b.year - a.year || b.month - a.month);
}

function selectVaried(photos: Photo[], limit: number): Photo[] {
  const pool = [...photos].sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)));
  const picked: Photo[] = [];
  let lastOrientation = "";

  while (picked.length < limit && pool.length > 0) {
    const variedIndex = pool.findIndex((photo) => (photo.orientation ?? "") !== lastOrientation);
    const next = pool.splice(variedIndex >= 0 ? variedIndex : 0, 1)[0];
    if (!next) break;
    picked.push(next);
    lastOrientation = next.orientation ?? "";
  }

  return picked.sort((a, b) => {
    const aDay = parseArchiveDate(a.date)?.day ?? 0;
    const bDay = parseArchiveDate(b.date)?.day ?? 0;
    return bDay - aDay;
  });
}

export function buildHomeArchive(
  photos: Photo[],
  maxMonths = 6,
  perMonth = 8,
  maxPhotos = 60,
): ArchiveMonth[] {
  const months: ArchiveMonth[] = [];
  let remaining = maxPhotos;

  for (const group of groupPhotosByMonth(photos).slice(0, maxMonths)) {
    if (remaining <= 0) break;
    const selected = selectVaried(group.photos, Math.min(perMonth, remaining));
    remaining -= selected.length;
    months.push({
      ...group,
      anchor: `home-archive-${group.id}`,
      total: group.photos.length,
      photos: selected,
    });
  }

  return months;
}

export function groupMonthsByYear(months: ArchiveMonth[]): Array<{
  year: string;
  months: ArchiveMonth[];
}> {
  const years: Array<{ year: string; months: ArchiveMonth[] }> = [];

  for (const month of months) {
    const label = month.year ? String(month.year) : "—";
    const current = years[years.length - 1];
    if (current?.year === label) {
      current.months.push(month);
    } else {
      years.push({ year: label, months: [month] });
    }
  }

  return years;
}
