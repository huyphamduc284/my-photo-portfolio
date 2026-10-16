export const PHOTO_CATEGORIES = ["places", "people", "things", "random"] as const;

export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number];

export type Photo = {
  id: number;
  src: string;
  date: string;
  location?: string;
  note?: string;
  category?: PhotoCategory;
  orientation?: "portrait" | "landscape";
  favorite?: boolean;
  width?: number;
  height?: number;
  alt?: string;
};
