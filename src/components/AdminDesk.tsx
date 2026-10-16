"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { revalidateArchive } from "@/app/admin/actions";
import { formatPhotoDate, parseArchiveDate } from "@/lib/archive";
import {
  formatFileSize,
  readImageDimensions,
  storagePathForDate,
  todayIsoDate,
  validatePhotoFile,
  type ImagePreview,
} from "@/lib/photos/desk";
import { createClient } from "@/lib/supabase/client";
import {
  deskPhotoFromRow,
  getPhotosFromSupabase,
  type DeskPhoto,
  type PhotoRow,
} from "@/lib/photos/getPhotos";
import JournalDesk from "@/components/JournalDesk";
import { PHOTO_CATEGORIES, type PhotoCategory } from "@/types/photo";

const BUCKET = "photos";

type PhotoDraft = {
  date: string;
  location: string;
  note: string;
  category: PhotoCategory;
  favorite: boolean;
};

function freshDraft(date = todayIsoDate()): PhotoDraft {
  return {
    date,
    location: "",
    note: "",
    category: "places",
    favorite: false,
  };
}

function toDateInput(date: string) {
  const parsed = parseArchiveDate(date);
  if (!parsed) return date;
  return `${parsed.year}-${String(parsed.month).padStart(2, "0")}-${String(parsed.day).padStart(2, "0")}`;
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

export default function AdminDesk() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [photos, setPhotos] = useState<DeskPhoto[]>([]);
  const [draft, setDraft] = useState<PhotoDraft>({
    date: "",
    location: "",
    note: "",
    category: "places",
    favorite: false,
  });
  const [preview, setPreview] = useState<ImagePreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(
    null,
  );
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<PhotoDraft>({
    date: "",
    location: "",
    note: "",
    category: "places",
    favorite: false,
  });
  const [pendingDelete, setPendingDelete] = useState<DeskPhoto | null>(null);
  const [listState, setListState] = useState<"loading" | "error" | "empty" | "ready">(
    "loading",
  );
  const [listError, setListError] = useState<string | null>(null);

  const loadPhotos = useCallback(async () => {
    setListState("loading");
    setListError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log("AUTH USER:", user);

    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .order("date", { ascending: false });

    console.log("PHOTOS DATA:", data);
    console.log("PHOTOS ERROR:", error);

    if (error) {
      setPhotos([]);
      setListState("error");
      setListError(error.message);
      setStatus({
        kind: "error",
        text: errorText("couldn't read the archive.", error),
      });
      return;
    }

    let rows = (data ?? []).map((row, index) =>
      deskPhotoFromRow(row as PhotoRow, index),
    );

    if (rows.length === 0) {
      const remote = await getPhotosFromSupabase();
      console.log("PUBLIC PHOTOS FALLBACK:", remote);
      if (remote.error) {
        setPhotos([]);
        setListState("error");
        setListError(remote.error);
        setStatus({
          kind: "error",
          text: errorText("couldn't read the archive.", remote.error),
        });
        return;
      }
      rows = remote.photos;
    }

    setPhotos(rows);
    setListState(rows.length > 0 ? "ready" : "empty");
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function prepare() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      if (cancelled) return;
      setDraft((current) => (current.date ? current : freshDraft()));
      setReady(true);
      await loadPhotos();
    }

    void prepare();
    return () => {
      cancelled = true;
    };
  }, [loadPhotos, router]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign("/");
  }

  async function onChooseFile(file: File | null) {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
    setStatus(null);

    if (!file) return;

    const invalid = validatePhotoFile(file);
    if (invalid) {
      setStatus({ kind: "error", text: invalid });
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    try {
      const { width, height } = await readImageDimensions(file);
      setPreview({
        file,
        url: URL.createObjectURL(file),
        width,
        height,
      });
    } catch {
      setStatus({ kind: "error", text: "couldn't read this photograph." });
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!preview) {
      setStatus({ kind: "error", text: "choose a photograph first." });
      return;
    }

    const invalid = validatePhotoFile(preview.file);
    if (invalid) {
      setStatus({ kind: "error", text: invalid });
      return;
    }

    if (!draft.date) {
      setStatus({ kind: "error", text: "couldn't upload this photograph.\nchoose a date." });
      return;
    }

    setBusy(true);
    setStatus(null);
    const path = storagePathForDate(draft.date, preview.file);
    const supabase = createClient();
    let uploaded = false;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("AUTH USER:", user);

      if (!user) {
        setStatus({ kind: "error", text: "couldn't upload this photograph.\nnot signed in." });
        router.replace("/login");
        return;
      }

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, preview.file, {
          cacheControl: "3600",
          upsert: false,
          contentType: preview.file.type,
        });

      console.log("UPLOAD RESULT:", uploadData);
      console.log("UPLOAD ERROR:", uploadError);

      if (uploadError) {
        setStatus({
          kind: "error",
          text: errorText("couldn't upload this photograph.", uploadError),
        });
        return;
      }

      uploaded = true;
      const storagePath = uploadData?.path ?? path;

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

      console.log("PUBLIC URL:", publicUrl);

      if (!publicUrl) {
        await supabase.storage.from(BUCKET).remove([storagePath]);
        setStatus({
          kind: "error",
          text: "couldn't upload this photograph.\nmissing public url.",
        });
        return;
      }

      const { data: insertData, error: insertError } = await supabase
        .from("photos")
        .insert({
          image_url: publicUrl,
          storage_path: storagePath,
          date: draft.date,
          location: draft.location.trim() || null,
          note: draft.note.trim() || null,
          category: draft.category,
          favorite: draft.favorite,
          width: preview.width,
          height: preview.height,
        })
        .select();

      console.log("INSERT RESULT:", insertData);
      console.log("INSERT ERROR:", insertError);

      if (insertError) {
        await supabase.storage.from(BUCKET).remove([storagePath]);
        setStatus({
          kind: "error",
          text: errorText("couldn't upload this photograph.", insertError),
        });
        return;
      }

      URL.revokeObjectURL(preview.url);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
      setDraft(freshDraft(draft.date));
      setStatus({ kind: "ok", text: "photograph added to the archive." });
      await loadPhotos();
      await revalidateArchive();
      router.refresh();
    } catch (error) {
      console.log("UPLOAD CATCH:", error);
      if (uploaded) {
        await supabase.storage.from(BUCKET).remove([path]);
      }
      setStatus({
        kind: "error",
        text: errorText("couldn't upload this photograph.", error),
      });
    } finally {
      setBusy(false);
    }
  }

  function startEdit(photo: DeskPhoto) {
    setEditingId(photo.id);
    setEditDraft({
      date: toDateInput(photo.date),
      location: photo.location ?? "",
      note: photo.note ?? "",
      category: photo.category ?? "places",
      favorite: photo.favorite ?? false,
    });
  }

  async function onSaveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingId == null) return;

    setBusy(true);
    setStatus(null);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("photos")
        .update({
          date: editDraft.date,
          location: editDraft.location.trim() || null,
          note: editDraft.note.trim() || null,
          category: editDraft.category,
          favorite: editDraft.favorite,
        })
        .eq("id", editingId);

      if (error) {
        setStatus({
          kind: "error",
          text: errorText("couldn't save this photograph.", error),
        });
        return;
      }

      setEditingId(null);
      setStatus({ kind: "ok", text: "photograph updated." });
      await loadPhotos();
      await revalidateArchive();
      router.refresh();
    } catch {
      setStatus({ kind: "error", text: "couldn't save this photograph." });
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    if (!pendingDelete.storagePath) {
      setStatus({
        kind: "error",
        text: "couldn't find this photograph in storage.",
      });
      return;
    }

    setBusy(true);
    setStatus(null);

    try {
      const supabase = createClient();
      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .remove([pendingDelete.storagePath]);

      if (storageError) {
        setStatus({
          kind: "error",
          text: errorText(
            "couldn't remove this photograph from storage.",
            storageError,
          ),
        });
        return;
      }

      const { error } = await supabase.from("photos").delete().eq("id", pendingDelete.id);
      if (error) {
        setStatus({
          kind: "error",
          text: errorText("couldn't leave this photograph behind.", error),
        });
        return;
      }

      if (editingId === pendingDelete.id) setEditingId(null);
      setPendingDelete(null);
      setStatus({ kind: "ok", text: "photograph left behind." });
      await loadPhotos();
      await revalidateArchive();
      router.refresh();
    } catch {
      setStatus({ kind: "error", text: "couldn't leave this photograph behind." });
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <p className="mt-16 font-serif text-xl italic text-text-secondary">
        looking through the desk…
      </p>
    );
  }

  return (
    <div className="mt-16">
      <div className="flex justify-end">
        <button type="button" onClick={() => void signOut()} className="desk-text-btn">
          sign out
        </button>
      </div>

      <section className="mt-6 max-w-md">
        <h2 className="font-serif text-2xl tracking-[0.14em]">UPLOAD A PHOTOGRAPH</h2>
        <div className="mt-4 border-t border-line/80" />

        <form onSubmit={(event) => void onUpload(event)} className="mt-10 space-y-8">
          <div>
            <p className="desk-label">Image file</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => void onChooseFile(event.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              className="desk-btn"
              onClick={() => fileRef.current?.click()}
            >
              choose file
            </button>
            {preview ? (
              <div className="mt-6">
                <img
                  src={preview.url}
                  alt=""
                  className="max-h-48 w-auto max-w-full"
                />
                <p className="mt-3 font-mono text-[10px] tracking-[0.14em] text-muted">
                  {preview.file.name}
                </p>
                <p className="font-mono text-[10px] tracking-[0.14em] text-muted">
                  {formatFileSize(preview.file.size)}
                </p>
                <p className="font-mono text-[10px] tracking-[0.14em] text-muted">
                  {preview.width} × {preview.height}
                </p>
              </div>
            ) : null}
          </div>

          <DraftFields idPrefix="upload" draft={draft} onChange={setDraft} />

          <button type="submit" disabled={busy} className="desk-btn">
            {busy ? "uploading" : "upload"}
            <span aria-hidden="true">→</span>
          </button>
        </form>
      </section>

      {status ? (
        <p
          className={`desk-status mt-10 whitespace-pre-line ${status.kind === "error" ? "desk-status-error" : ""}`}
          role="status"
        >
          {status.text}
        </p>
      ) : null}

      <section className="mt-24">
        <h2 className="font-serif text-2xl tracking-[0.14em]">MANAGE PHOTOGRAPHS</h2>
        <div className="mt-4 border-t border-line/80" />

        {listState === "loading" ? (
          <p className="mt-10 font-serif text-xl italic text-text-secondary">
            looking through the desk…
          </p>
        ) : listState === "error" ? (
          <p className="desk-status desk-status-error mt-10 whitespace-pre-line" role="status">
            {errorText("couldn't read the archive.", listError)}
          </p>
        ) : listState === "empty" ? (
          <p className="mt-10 font-serif text-xl italic text-text-secondary">
            nothing here yet.
          </p>
        ) : (
          <ul className="mt-4">
            {photos.map((photo) => {
              const editing = editingId === photo.id;

              return (
                <li key={photo.id} className="border-b border-line/80 py-8">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-10">
                    <div className="relative h-36 w-28 shrink-0 bg-background-warm">
                      {photo.src ? (
                        <Image
                          src={photo.src}
                          alt={photo.note ?? photo.location ?? "Photograph"}
                          fill
                          sizes="112px"
                          quality={75}
                          className="object-contain"
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[10px] tracking-[0.16em] text-muted">
                        {formatPhotoDate(photo.date)}
                      </p>
                      {photo.location ? (
                        <p className="mt-1 font-serif text-xl">{photo.location}</p>
                      ) : null}
                      {photo.note ? (
                        <p className="mt-1 text-[15px] text-text-secondary">{photo.note}</p>
                      ) : null}
                      <p className="mt-4 font-mono text-[10px] tracking-[0.2em] text-muted">
                        {(photo.category ?? "random").toUpperCase()}
                        {photo.favorite ? " · FAVORITE" : ""}
                      </p>

                      <div className="mt-5 flex gap-6">
                        <button
                          type="button"
                          className="desk-text-btn"
                          onClick={() => (editing ? setEditingId(null) : startEdit(photo))}
                        >
                          {editing ? "close" : "edit"}
                        </button>
                        <button
                          type="button"
                          className="desk-text-btn"
                          onClick={() => setPendingDelete(photo)}
                        >
                          delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {editing ? (
                    <form
                      onSubmit={(event) => void onSaveEdit(event)}
                      className="mt-8 max-w-md space-y-8 border-t border-line/70 pt-8"
                    >
                      <DraftFields
                        idPrefix="edit"
                        draft={editDraft}
                        onChange={setEditDraft}
                      />
                      <button type="submit" disabled={busy} className="desk-btn">
                        save
                        <span aria-hidden="true">→</span>
                      </button>
                    </form>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <JournalDesk photos={photos} />

      {pendingDelete ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-background/80 px-5">
          <div className="w-full max-w-sm border border-line bg-background px-8 py-10">
            <p className="font-serif text-2xl leading-snug">
              leave this photograph behind?
            </p>
            <p className="mt-4 font-mono text-[10px] tracking-[0.16em] text-muted">
              {formatPhotoDate(pendingDelete.date)}
              {pendingDelete.location ? ` · ${pendingDelete.location}` : ""}
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
    </div>
  );
}

function DraftFields({
  idPrefix,
  draft,
  onChange,
}: {
  idPrefix: string;
  draft: PhotoDraft;
  onChange: (draft: PhotoDraft) => void;
}) {
  return (
    <>
      <div>
        <label htmlFor={`${idPrefix}-date`} className="desk-label">
          Date
        </label>
        <input
          id={`${idPrefix}-date`}
          type="date"
          required
          value={draft.date}
          onChange={(event) => onChange({ ...draft, date: event.target.value })}
          className="desk-input"
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-location`} className="desk-label">
          Location
        </label>
        <input
          id={`${idPrefix}-location`}
          type="text"
          value={draft.location}
          onChange={(event) => onChange({ ...draft, location: event.target.value })}
          className="desk-input"
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-note`} className="desk-label">
          Note
        </label>
        <textarea
          id={`${idPrefix}-note`}
          value={draft.note}
          onChange={(event) => onChange({ ...draft, note: event.target.value })}
          className="desk-textarea"
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-category`} className="desk-label">
          Category
        </label>
        <select
          id={`${idPrefix}-category`}
          value={draft.category}
          onChange={(event) =>
            onChange({ ...draft, category: event.target.value as PhotoCategory })
          }
          className="desk-select"
        >
          {PHOTO_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={draft.favorite}
          onChange={(event) => onChange({ ...draft, favorite: event.target.checked })}
          className="desk-check"
        />
        <span className="desk-label mb-0">Favorite</span>
      </label>
    </>
  );
}
