import { Suspense } from "react";
import HeroStatement from "@/components/HeroStatement";
import FeaturedEntry from "@/components/FeaturedEntry";
import HomeArchive from "@/components/HomeArchive";
import { getFeaturedJournalEntry } from "@/lib/journal";
import {
  getPhotosFromSupabase,
  pickFeaturedHomePhoto,
  pickHomePreviewPhotos,
} from "@/lib/photos/getPhotos";

async function HomePhotos() {
  const remote = await getPhotosFromSupabase();
  const photos = remote.error ? [] : remote.photos;
  const featuredJournal = await getFeaturedJournalEntry();
  const featuredPhoto =
    featuredJournal?.cover ??
    featuredJournal?.photos[0] ??
    pickFeaturedHomePhoto(photos);
  const preview = pickHomePreviewPhotos(photos);

  return (
    <>
      <section className="animate-fade-up grid items-start gap-14 border-b border-line/90 py-14 lg:grid-cols-12 lg:gap-10 lg:py-20">
        <div className="lg:col-span-5">
          <HeroStatement />
        </div>
        <div className="lg:col-span-7">
          <FeaturedEntry entry={featuredJournal} photo={featuredPhoto} />
        </div>
      </section>

      <div className="animate-fade-up delay-1 pt-16">
        <HomeArchive photos={preview} />
      </div>
    </>
  );
}

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-24 sm:px-8 lg:px-10">
      <Suspense fallback={<div className="h-80" aria-hidden="true" />}>
        <HomePhotos />
      </Suspense>
    </div>
  );
}
