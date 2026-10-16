import { journalEntries } from "@/data/journal";
import type { JournalEntry } from "@/types/journal";

export function getJournalEntries(): JournalEntry[] {
  return journalEntries;
}

export function getFeaturedEntry(): JournalEntry {
  return journalEntries[0];
}

export function getJournalBySlug(slug: string): JournalEntry | undefined {
  return journalEntries.find((entry) => entry.slug === slug);
}
