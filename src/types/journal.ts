import type { Photo } from "@/types/photo";

export type JournalEntry = {
  id: number;
  title: string;
  slug: string;
  date: string;
  location?: string;
  excerpt?: string;
  body?: string;
  coverPhotoId?: number | null;
  published: boolean;
  featured: boolean;
  createdAt?: string;
  updatedAt?: string;
  photos: Photo[];
  cover?: Photo | null;
};
