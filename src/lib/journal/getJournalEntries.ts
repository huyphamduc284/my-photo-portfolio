import { createPublicClient } from "@/lib/photos/getPhotos";
import { JOURNAL_SELECT, mapJournalEntry, type JournalEntryRow } from "@/lib/journal/mapEntry";
import type { JournalEntry } from "@/types/journal";

function asRows(data: unknown): JournalEntryRow[] {
  return Array.isArray(data) ? (data as JournalEntryRow[]) : [];
}

export async function getPublishedJournalEntries(): Promise<JournalEntry[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("journal_entries")
      .select(JOURNAL_SELECT)
      .eq("published", true)
      .order("date", { ascending: false });

    if (error) {
      console.log("SUPABASE JOURNAL:", error.message);
      return [];
    }

    return asRows(data).map(mapJournalEntry);
  } catch (error) {
    console.log("SUPABASE JOURNAL:", error);
    return [];
  }
}

export async function getFeaturedJournalEntry(): Promise<JournalEntry | null> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("journal_entries")
      .select(JOURNAL_SELECT)
      .eq("published", true)
      .eq("featured", true)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return mapJournalEntry(data as JournalEntryRow);
  } catch {
    return null;
  }
}

export async function getPublishedJournalSlugs(): Promise<string[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("journal_entries")
      .select("slug")
      .eq("published", true);

    if (error) return [];
    return (data ?? [])
      .map((row) => (typeof row.slug === "string" ? row.slug : ""))
      .filter(Boolean);
  } catch {
    return [];
  }
}
