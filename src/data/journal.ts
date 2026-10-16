import type { JournalEntry } from "@/types/journal";

/**
 * Journal entries.
 *
 * To add an entry:
 * 1. Add photos to /public/photos and src/data/photos.ts
 * 2. Add one object below
 */
export const journalEntries: JournalEntry[] = [
  {
    id: 1,
    slug: "quiet-afternoon-bao-loc",
    title: "A quiet afternoon in Bao Loc",
    date: "15.10.26",
    location: "Bao Loc",
    excerpt: "Good coffee, cooler air, and a slower pace.",
    body: "Spent the afternoon wandering, taking photos, and just being there for a while.\n\nNothing particular happened. That was the point.",
    coverImage: "/photos/photo-01.jpg",
    photoIds: [1, 11, 8],
  },
  {
    id: 2,
    slug: "cooler-air-da-lat",
    title: "Cooler air in Da Lat",
    date: "12.10.26",
    location: "Da Lat",
    excerpt: "The light stays longer here. People sit by windows.",
    body: "Walked until the fog came down. Took a few frames of whoever happened to be nearby, then coffee that went cold.",
    coverImage: "/photos/photo-09.jpg",
    photoIds: [9, 2, 6],
  },
  {
    id: 3,
    slug: "on-the-way",
    title: "On the way",
    date: "03.03.25",
    location: "Sapa",
    excerpt: "Mountains, still water, and the hours between places.",
    body: "Most of these were taken from the seat, or just after getting out of the car. I keep them because the air felt different.",
    coverImage: "/photos/photo-03.jpg",
    photoIds: [3, 5, 7, 12],
  },
];
