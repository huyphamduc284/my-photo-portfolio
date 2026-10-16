export type JournalEntry = {
  id: number;
  slug: string;
  title: string;
  date: string;
  location?: string;
  excerpt?: string;
  body?: string;
  coverImage: string;
  photoIds: number[];
};
