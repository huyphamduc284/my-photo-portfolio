import {
  deskPhotoFromRow,
  mapPhoto,
  type PhotoRow,
} from "@/lib/photos/getPhotos";
import type { JournalEntry } from "@/types/journal";
import type { Photo } from "@/types/photo";

export type JournalPhotoLink = {
  position: number | null;
  photo?: PhotoRow | PhotoRow[] | null;
  photos?: PhotoRow | PhotoRow[] | null;
};

export type JournalEntryRow = {
  id: number;
  title: string;
  slug: string;
  date: string;
  location: string | null;
  excerpt: string | null;
  body: string | null;
  cover_photo_id: number | null;
  published: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
  journal_entry_photos?: JournalPhotoLink[] | null;
};

function asPhoto(row: PhotoRow | PhotoRow[] | null, index: number): Photo | null {
  const value = Array.isArray(row) ? row[0] : row;
  if (!value) return null;
  return mapPhoto(value, index) ?? deskPhotoFromRow(value, index);
}

export const JOURNAL_SELECT = `
  id,
  title,
  slug,
  date,
  location,
  excerpt,
  body,
  cover_photo_id,
  published,
  featured,
  created_at,
  updated_at,
  journal_entry_photos (
    position,
    photo:photos (*)
  )
`;

export function mapJournalEntry(row: JournalEntryRow): JournalEntry {
  const links = [...(row.journal_entry_photos ?? [])].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );
  const photos = links
    .map((link, index) => asPhoto(link.photo ?? link.photos ?? null, index))
    .filter((photo): photo is Photo => Boolean(photo));
  const cover =
    photos.find((photo) => photo.id === row.cover_photo_id) ?? photos[0] ?? null;

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    date: row.date,
    location: row.location ?? undefined,
    excerpt: row.excerpt ?? undefined,
    body: row.body ?? undefined,
    coverPhotoId: row.cover_photo_id,
    published: row.published,
    featured: row.featured,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    photos,
    cover,
  };
}
