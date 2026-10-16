import { createClient } from "@supabase/supabase-js";
import { PHOTO_CATEGORIES, type Photo, type PhotoCategory } from "@/types/photo";

export type PhotoRow = {
  id: number | string;
  image_url: string | null;
  storage_path: string | null;
  date: string | null;
  location: string | null;
  note: string | null;
  category: string | null;
  favorite: boolean | null;
  width: number | string | null;
  height: number | string | null;
};

export type DeskPhoto = Photo & {
  storagePath?: string;
};

export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return createClient(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function photoId(value: PhotoRow["id"], index: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;
  return index + 1;
}

function asCategory(value: string | null): PhotoCategory | undefined {
  const category = value?.trim().toLowerCase();
  return PHOTO_CATEGORIES.find((item) => item === category);
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
}

export function mapPhoto(row: PhotoRow, index: number): DeskPhoto | null {
  const src = row.image_url?.trim();
  const date = row.date?.trim();
  if (!src || !date) return null;
  return deskPhotoFromRow(row, index);
}

export function deskPhotoFromRow(row: PhotoRow, index: number): DeskPhoto {
  const width = asNumber(row.width);
  const height = asNumber(row.height);

  return {
    id: photoId(row.id, index),
    src: row.image_url?.trim() ?? "",
    date: row.date?.trim() ?? "",
    location: row.location ?? undefined,
    note: row.note ?? undefined,
    category: asCategory(row.category),
    favorite: row.favorite ?? false,
    width,
    height,
    orientation:
      width && height ? (height > width ? "portrait" : "landscape") : undefined,
    storagePath: row.storage_path?.trim() || undefined,
  };
}

export async function getPhotosFromSupabase(): Promise<{
  photos: Photo[];
  error: string | null;
}> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .order("date", { ascending: false });

    console.log("SUPABASE PHOTOS:", data);
    console.log("SUPABASE ERROR:", error);

    if (error) {
      return { photos: [], error: error.message };
    }

    const photos = (data ?? [])
      .map((row, index) => mapPhoto(row as PhotoRow, index))
      .filter((photo): photo is DeskPhoto => Boolean(photo));

    return { photos, error: null };
  } catch (error) {
    console.log("SUPABASE PHOTOS:", null);
    console.log("SUPABASE ERROR:", error);

    return {
      photos: [],
      error: error instanceof Error ? error.message : "Supabase photos query failed.",
    };
  }
}

export function pickFeaturedHomePhoto(photos: Photo[]): Photo | null {
  return photos.find((photo) => photo.favorite) ?? photos[0] ?? null;
}

export function pickHomePreviewPhotos(photos: Photo[], limit = 12): Photo[] {
  return photos.slice(0, limit);
}
