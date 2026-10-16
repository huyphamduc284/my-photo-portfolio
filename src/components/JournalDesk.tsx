"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { revalidateJournal } from "@/app/admin/actions";
import { formatPhotoDate } from "@/lib/archive";
import { JOURNAL_SELECT, mapJournalEntry, type JournalEntryRow } from "@/lib/journal/mapEntry";
import { slugify } from "@/lib/journal/slug";
import { filterPhotos, getPhotoAlt, getPhotoSrc, type ArchiveFilter } from "@/lib/photos";
import { createClient } from "@/lib/supabase/client";
import type { DeskPhoto } from "@/lib/photos/getPhotos";
import type { JournalEntry } from "@/types/journal";

type JournalDraft = {
  title: string;
  slug: string;
  date: string;
  location: string;
  excerpt: string;
  body: string;
  featured: boolean;
  published: boolean;
  coverPhotoId: number | null;
  photoIds: number[];
};

const FILTERS: { id: ArchiveFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "places", label: "Places" },
  { id: "people", label: "People" },
  { id: "things", label: "Things" },
  { id: "random", label: "Random" },
  { id: "favorites", label: "Favorites" },
];

function emptyDraft(date: string): JournalDraft {
  return {
    title: "",
    slug: "",
    date,
    location: "",
    excerpt: "",
    body: "",
    featured: false,
    published: false,
    coverPhotoId: null,
    photoIds: [],
  };
}

function fromEntry(entry: JournalEntry): JournalDraft {
  return {
    title: entry.title,
    slug: entry.slug,
    date: entry.date.slice(0, 10),
    location: entry.location ?? "",
    excerpt: entry.excerpt ?? "",
    body: entry.body ?? "",
    featured: entry.featured,
    published: entry.published,
    coverPhotoId: entry.coverPhotoId ?? entry.cover?.id ?? null,
    photoIds: entry.photos.map((photo) => photo.id),
  };
}

function errorText(prefix: string, error: unknown) {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message?: string }).message ?? "")
      : error instanceof Error
        ? error.message
        : "";
  return message ? `${prefix}\n${message}` : prefix;
}

export default function JournalDesk({ photos }: { photos: DeskPhoto[] }) {
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [mode, setMode] = useState<"list" | "form">("list");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<JournalDraft>(() => emptyDraft(""));
  const [slugTouched, setSlugTouched] = useState(false);
  const [filter, setFilter] = useState<ArchiveFilter>("all");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(
    null,
  );
  const [pendingDelete, setPendingDelete] = useState<JournalEntry | null>(null);

  const available = useMemo(() => filterPhotos(photos, filter), [filter, photos]);
  const selectedPhotos = draft.photoIds
    .map((id) => photos.find((photo) => photo.id === id))
    .filter((photo): photo is DeskPhoto => Boolean(photo));

  async function loadEntries() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("journal_entries")
      .select(JOURNAL_SELECT)
      .order("date", { ascending: false });

    if (error) {
      setStatus({
        kind: "error",
        text: errorText("couldn't load journal entries.", error),
      });
      setEntries([]);
      return;
    }

    setEntries(((data ?? []) as JournalEntryRow[]).map(mapJournalEntry));
  }

  useEffect(() => {
    void loadEntries();
  }, []);

  function startNew() {
    const today = new Date();
    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    setEditingId(null);
    setSlugTouched(false);
    setDraft(emptyDraft(date));
    setStatus(null);
    setMode("form");
  }

  function startEdit(entry: JournalEntry) {
    setEditingId(entry.id);
    setSlugTouched(true);
    setDraft(fromEntry(entry));
    setStatus(null);
    setMode("form");
  }

  function togglePhoto(id: number) {
    setDraft((current) => {
      const selected = current.photoIds.includes(id);
      const photoIds = selected
        ? current.photoIds.filter((item) => item !== id)
        : [...current.photoIds, id];
      const coverPhotoId = photoIds.includes(current.coverPhotoId ?? -1)
        ? current.coverPhotoId
        : (photoIds[0] ?? null);
      return { ...current, photoIds, coverPhotoId };
    });
  }

  function movePhoto(id: number, direction: -1 | 1) {
    setDraft((current) => {
      const index = current.photoIds.indexOf(id);
      const next = index + direction;
      if (index < 0 || next < 0 || next >= current.photoIds.length) return current;
      const photoIds = [...current.photoIds];
      const [item] = photoIds.splice(index, 1);
      photoIds.splice(next, 0, item);
      return { ...current, photoIds };
    });
  }

  async function slugTaken(slug: string, ignoreId: number | null) {
    const supabase = createClient();
    const query = supabase.from("journal_entries").select("id").eq("slug", slug);
    const { data, error } = ignoreId
      ? await query.neq("id", ignoreId).maybeSingle()
      : await query.maybeSingle();
    if (error && error.code !== "PGRST116") throw error;
    return Boolean(data);
  }

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = draft.title.trim();
    const slug = slugify(draft.slug || draft.title);
    if (!title || !slug || !draft.date) {
      setStatus({ kind: "error", text: "couldn't save this entry." });
      return;
    }

    setBusy(true);
    setStatus(null);

    try {
      if (await slugTaken(slug, editingId)) {
        setStatus({ kind: "error", text: "couldn't save this entry.\nslug already used." });
        return;
      }

      const supabase = createClient();
      const payload = {
        title,
        slug,
        date: draft.date,
        location: draft.location.trim() || null,
        excerpt: draft.excerpt.trim() || null,
        body: draft.body.trim() || null,
        cover_photo_id: draft.coverPhotoId,
        featured: draft.featured,
        published: draft.published,
      };

      let entryId = editingId;

      if (editingId == null) {
        const { data, error } = await supabase
          .from("journal_entries")
          .insert(payload)
          .select("id")
          .single();
        if (error || !data) {
          setStatus({ kind: "error", text: errorText("couldn't save this entry.", error) });
          return;
        }
        entryId = data.id as number;
      } else {
        const { error } = await supabase
          .from("journal_entries")
          .update(payload)
          .eq("id", editingId);
        if (error) {
          setStatus({ kind: "error", text: errorText("couldn't save this entry.", error) });
          return;
        }
        const { error: clearError } = await supabase
          .from("journal_entry_photos")
          .delete()
          .eq("journal_entry_id", editingId);
        if (clearError) {
          setStatus({
            kind: "error",
            text: errorText("couldn't save this entry.", clearError),
          });
          return;
        }
      }

      if (entryId != null && draft.photoIds.length > 0) {
        const { error } = await supabase.from("journal_entry_photos").insert(
          draft.photoIds.map((photoId, position) => ({
            journal_entry_id: entryId,
            photo_id: photoId,
            position,
          })),
        );
        if (error) {
          setStatus({ kind: "error", text: errorText("couldn't save this entry.", error) });
          return;
        }
      }

      setStatus({
        kind: "ok",
        text: editingId == null ? "entry added to the journal." : "journal entry updated.",
      });
      setMode("list");
      setEditingId(null);
      await loadEntries();
      await revalidateJournal(slug);
      router.refresh();
    } catch (error) {
      setStatus({ kind: "error", text: errorText("couldn't save this entry.", error) });
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusy(true);
    setStatus(null);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("journal_entries")
        .delete()
        .eq("id", pendingDelete.id);
      if (error) {
        setStatus({ kind: "error", text: errorText("couldn't delete this entry.", error) });
        return;
      }
      setPendingDelete(null);
      setStatus({ kind: "ok", text: "entry left the journal." });
      await loadEntries();
      await revalidateJournal(pendingDelete.slug);
      router.refresh();
    } catch {
      setStatus({ kind: "error", text: "couldn't delete this entry." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-24 border-t border-line/90 pt-16">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h2 className="font-serif text-3xl tracking-[0.12em] sm:text-4xl">
            JOURNAL ENTRIES
          </h2>
          <p className="mt-3 font-serif text-xl leading-snug text-text-secondary">
            pages made from photographs already in the archive.
          </p>
        </div>
        {mode === "list" ? (
          <button type="button" className="desk-text-btn shrink-0" onClick={startNew}>
            NEW ENTRY
          </button>
        ) : (
          <button
            type="button"
            className="desk-text-btn shrink-0"
            onClick={() => {
              setMode("list");
              setEditingId(null);
            }}
          >
            back
          </button>
        )}
      </div>

      {status ? (
        <p className={`desk-status mt-8 ${status.kind === "error" ? "desk-status-error" : ""}`}>
          {status.text}
        </p>
      ) : null}

      {mode === "list" ? (
        entries.length === 0 ? (
          <p className="mt-12 font-serif text-xl italic text-text-secondary">
            nothing here yet.
          </p>
        ) : (
          <ul className="mt-12 divide-y divide-line/80 border-y border-line/80">
            {entries.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-end justify-between gap-4 py-6">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.16em] text-muted">
                    {formatPhotoDate(entry.date)}
                    {entry.location ? ` · ${entry.location}` : ""}
                    {entry.published ? "" : " · draft"}
                    {entry.featured ? " · featured" : ""}
                  </p>
                  <p className="mt-2 font-serif text-2xl leading-snug">{entry.title}</p>
                </div>
                <div className="flex gap-6">
                  <button type="button" className="desk-text-btn" onClick={() => startEdit(entry)}>
                    EDIT
                  </button>
                  <button
                    type="button"
                    className="desk-text-btn"
                    onClick={() => setPendingDelete(entry)}
                  >
                    DELETE
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : (
        <form className="mt-12 max-w-2xl space-y-8" onSubmit={(event) => void onSave(event)}>
          <div>
            <label htmlFor="journal-title" className="desk-label">
              Title
            </label>
            <input
              id="journal-title"
              value={draft.title}
              onChange={(event) => {
                const title = event.target.value;
                setDraft((current) => ({
                  ...current,
                  title,
                  slug: slugTouched ? current.slug : slugify(title),
                }));
              }}
              className="desk-input"
              required
            />
          </div>
          <div>
            <label htmlFor="journal-slug" className="desk-label">
              Slug
            </label>
            <input
              id="journal-slug"
              value={draft.slug}
              onChange={(event) => {
                setSlugTouched(true);
                setDraft((current) => ({ ...current, slug: slugify(event.target.value) }));
              }}
              className="desk-input"
              required
            />
          </div>
          <div>
            <label htmlFor="journal-date" className="desk-label">
              Date
            </label>
            <input
              id="journal-date"
              type="date"
              value={draft.date}
              onChange={(event) => setDraft({ ...draft, date: event.target.value })}
              className="desk-input"
              required
            />
          </div>
          <div>
            <label htmlFor="journal-location" className="desk-label">
              Location
            </label>
            <input
              id="journal-location"
              value={draft.location}
              onChange={(event) => setDraft({ ...draft, location: event.target.value })}
              className="desk-input"
            />
          </div>
          <div>
            <label htmlFor="journal-excerpt" className="desk-label">
              Excerpt
            </label>
            <textarea
              id="journal-excerpt"
              value={draft.excerpt}
              onChange={(event) => setDraft({ ...draft, excerpt: event.target.value })}
              className="desk-textarea"
            />
          </div>
          <div>
            <label htmlFor="journal-body" className="desk-label">
              Body
            </label>
            <textarea
              id="journal-body"
              value={draft.body}
              onChange={(event) => setDraft({ ...draft, body: event.target.value })}
              className="desk-textarea min-h-40"
            />
          </div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={draft.featured}
              onChange={(event) => setDraft({ ...draft, featured: event.target.checked })}
              className="desk-check"
            />
            <span className="desk-label mb-0">Featured</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={draft.published}
              onChange={(event) => setDraft({ ...draft, published: event.target.checked })}
              className="desk-check"
            />
            <span className="desk-label mb-0">Published</span>
          </label>

          <div>
            <p className="desk-label">Photographs</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`desk-text-btn ${filter === item.id ? "text-text" : ""}`}
                  onClick={() => setFilter(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <ul className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {available.map((photo) => {
                const selected = draft.photoIds.includes(photo.id);
                return (
                  <li key={photo.id}>
                    <button
                      type="button"
                      onClick={() => togglePhoto(photo.id)}
                      className={`block w-full overflow-hidden border ${
                        selected ? "border-olive" : "border-line/80"
                      }`}
                    >
                      <span className="relative block aspect-square">
                        {photo.src ? (
                          <Image
                            src={getPhotoSrc(photo)}
                            alt={getPhotoAlt(photo)}
                            fill
                            sizes="120px"
                            quality={90}
                            className="object-cover"
                          />
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {photos.length === 0 ? (
              <p className="mt-4 font-serif italic text-text-secondary">nothing here yet.</p>
            ) : null}
          </div>

          {selectedPhotos.length > 0 ? (
            <div>
              <p className="desk-label">Order and cover</p>
              <ul className="mt-4 space-y-4">
                {selectedPhotos.map((photo, index) => (
                  <li key={photo.id} className="flex items-center gap-4 border-b border-line/70 py-3">
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden">
                      <Image
                        src={getPhotoSrc(photo)}
                        alt={getPhotoAlt(photo)}
                        fill
                        sizes="56px"
                        quality={90}
                        className="object-cover"
                      />
                    </span>
                    <p className="min-w-0 flex-1 font-mono text-[10px] tracking-[0.14em] text-muted">
                      {formatPhotoDate(photo.date)}
                      {photo.location ? ` · ${photo.location}` : ""}
                    </p>
                    <button
                      type="button"
                      className="desk-text-btn"
                      disabled={index === 0}
                      onClick={() => movePhoto(photo.id, -1)}
                    >
                      MOVE UP
                    </button>
                    <button
                      type="button"
                      className="desk-text-btn"
                      disabled={index === selectedPhotos.length - 1}
                      onClick={() => movePhoto(photo.id, 1)}
                    >
                      MOVE DOWN
                    </button>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="cover-photo"
                        checked={draft.coverPhotoId === photo.id}
                        onChange={() => setDraft({ ...draft, coverPhotoId: photo.id })}
                        className="desk-check"
                      />
                      <span className="desk-label mb-0">Cover</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <button type="submit" className="desk-btn" disabled={busy}>
            {busy ? "saving..." : editingId == null ? "save entry" : "save changes"}
          </button>
        </form>
      )}

      {pendingDelete ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-background/80 px-5">
          <div className="w-full max-w-sm border border-line bg-background px-8 py-10">
            <p className="font-serif text-2xl leading-snug">leave this entry behind?</p>
            <p className="mt-4 font-mono text-[10px] tracking-[0.16em] text-muted">
              {pendingDelete.title}
            </p>
            <div className="mt-10 flex items-center justify-between">
              <button
                type="button"
                className="desk-text-btn"
                onClick={() => setPendingDelete(null)}
              >
                cancel
              </button>
              <button
                type="button"
                className="desk-text-btn"
                disabled={busy}
                onClick={() => void confirmDelete()}
              >
                delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
