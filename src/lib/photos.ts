import { photos } from "@/data/photos";
import type { Photo, PhotoCategory } from "@/types/photo";

export const ARCHIVE_SIZES =
  "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw";

export const FEATURED_SIZES = "(max-width: 768px) 100vw, 50vw";

export const HERO_SIZES = "100vw";

export const LIGHTBOX_SIZES = "100vw";

export type ArchiveFilter = "all" | PhotoCategory | "favorites";

export function getPhotos(): Photo[] {
  return photos;
}

export function getPhotoById(id: number): Photo | undefined {
  return photos.find((photo) => photo.id === id);
}

export function getPhotosByIds(ids: number[]): Photo[] {
  return ids
    .map((id) => getPhotoById(id))
    .filter((photo): photo is Photo => Boolean(photo));
}

export function getFavoritePhotos(): Photo[] {
  return photos.filter((photo) => photo.favorite);
}

export function getPhotoSrc(photo: Photo): string {
  return photo.src;
}

export function getPhotoAlt(photo: Photo): string {
  if (photo.alt) return photo.alt;
  const bits = [photo.location, photo.note, photo.date].filter(Boolean);
  return bits.join(", ") || "Photograph";
}

export function getPhotoDimensions(photo: Photo): { width: number; height: number } {
  if (photo.width && photo.height) {
    return { width: photo.width, height: photo.height };
  }

  if (photo.orientation === "portrait") {
    return { width: 1600, height: 2400 };
  }

  return { width: 2400, height: 1600 };
}

export function filterPhotos(list: Photo[], filter: ArchiveFilter): Photo[] {
  if (filter === "all") return list;
  if (filter === "favorites") return list.filter((photo) => photo.favorite);
  return list.filter((photo) => photo.category === filter);
}
