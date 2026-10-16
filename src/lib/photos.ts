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

  if (photo.orientation === "landscape") {
    return { width: 2400, height: 1600 };
  }

  return { width: 1600, height: 2400 };
}

export function photoAspectRatio(photo: Photo) {
  const { width, height } = getPhotoDimensions(photo);
  return height > 0 ? width / height : 1;
}

function archiveShift(index: number) {
  return ["", "md:ml-[8%]", "md:ml-auto", "md:ml-[5%]"][index % 4];
}

export function archivePhotoFrameClass(photo: Photo, index: number) {
  const ratio = photoAspectRatio(photo);
  const shift = archiveShift(index);

  if (ratio < 0.92) {
    return `w-[92%] md:w-[34%] md:max-w-[480px] ${shift}`;
  }
  if (ratio > 1.7) {
    return `w-full md:w-[68%] md:max-w-[850px] ${shift}`;
  }
  return `w-full md:w-[54%] md:max-w-[780px] ${shift}`;
}

export function journalPhotoFrameClass(
  photo: Photo,
  kind: "cover" | "pair" | "single" = "single",
) {
  const ratio = photoAspectRatio(photo);
  const portrait = ratio < 0.92;
  const wide = ratio > 1.7;

  if (kind === "pair") {
    if (portrait) return "w-full max-w-[480px]";
    return "w-full max-w-[620px]";
  }

  if (portrait) return "w-full max-w-[500px]";
  if (wide) return "w-full max-w-[850px]";
  return "w-full max-w-[780px]";
}

export function featuredPhotoFrameClass(photo: Photo) {
  const ratio = photoAspectRatio(photo);
  if (ratio < 0.92) return "w-full max-w-[500px]";
  if (ratio > 1.7) return "w-full max-w-[850px]";
  return "w-full max-w-[760px]";
}

export function filterPhotos(list: Photo[], filter: ArchiveFilter): Photo[] {
  if (filter === "all") return list;
  if (filter === "favorites") return list.filter((photo) => photo.favorite);
  return list.filter((photo) => photo.category === filter);
}
