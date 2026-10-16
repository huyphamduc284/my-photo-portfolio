import { Suspense } from "react";
import type { Metadata } from "next";
import ArchiveView from "@/components/ArchiveView";
import { getPhotos } from "@/lib/photos";
import { getPhotosFromSupabase } from "@/lib/photos/getPhotos";

export const metadata: Metadata = {
  title: "Archive",
};

async function ArchivePhotos() {
  const remote = await getPhotosFromSupabase();
  const useRemote = remote.photos.length > 0 && !remote.error;
  const photos = useRemote ? remote.photos : getPhotos();
  const source = useRemote ? "supabase" : "local";

  if (!useRemote) {
    console.log(
      "[archive] using local fallback",
      remote.error
        ? `reason=error ${remote.error}`
        : "reason=zero rows",
    );
  } else {
    console.log(`[archive] using Supabase photos count=${remote.photos.length}`);
  }

  return (
    <div data-photo-source={source} data-supabase-count={remote.photos.length}>
      <ArchiveView photos={photos} variant="archive" />
    </div>
  );
}

export default function ArchivePage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 pb-24 pt-12 sm:px-8 sm:pt-16 lg:px-10">
      <header className="animate-fade-up mb-12 max-w-lg">
        <h1 className="font-serif text-5xl tracking-[0.14em] sm:text-6xl">ARCHIVE</h1>
        <p className="mt-5 font-serif text-2xl leading-snug text-text-secondary">
          everything,
          <br />
          more or less.
        </p>
      </header>
      <Suspense fallback={<div className="h-40" aria-hidden="true" />}>
        <ArchivePhotos />
      </Suspense>
    </section>
  );
}
