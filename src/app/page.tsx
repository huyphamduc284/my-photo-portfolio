import HeroStatement from "@/components/HeroStatement";
import FeaturedEntry from "@/components/FeaturedEntry";
import HomeArchive from "@/components/HomeArchive";
import { getFeaturedEntry } from "@/lib/journal";
import { getPhotos } from "@/lib/photos";

export default function HomePage() {
  const featured = getFeaturedEntry();
  const photos = getPhotos();

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-24 sm:px-8 lg:px-10">
      <section className="animate-fade-up grid items-start gap-14 border-b border-line/90 py-14 lg:grid-cols-12 lg:gap-10 lg:py-20">
        <div className="lg:col-span-5">
          <HeroStatement />
        </div>
        <div className="lg:col-span-7">
          <FeaturedEntry entry={featured} />
        </div>
      </section>

      <div className="animate-fade-up delay-1 pt-16">
        <HomeArchive photos={photos} />
      </div>
    </div>
  );
}
