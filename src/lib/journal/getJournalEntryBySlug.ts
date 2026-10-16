import { createPublicClient } from "@/lib/photos/getPhotos";
import { JOURNAL_SELECT, mapJournalEntry, type JournalEntryRow } from "@/lib/journal/mapEntry";
import type { JournalEntry } from "@/types/journal";

export async function getPublishedJournalEntryBySlug(
  slug: string,
): Promise<JournalEntry | null> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("journal_entries")
      .select(JOURNAL_SELECT)
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();

    if (error || !data) return null;
    return mapJournalEntry(data as JournalEntryRow);
  } catch {
    return null;
  }
}
