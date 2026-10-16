import type { Metadata } from "next";
import Image from "next/image";
import { site } from "@/data/site";
import HandwrittenNote from "@/components/HandwrittenNote";
import {
  getPhotoAlt,
  getPhotoById,
  getPhotoDimensions,
  getPhotoSrc,
} from "@/lib/photos";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  const portrait = getPhotoById(2) ?? getPhotoById(1);
  const dimensions = portrait ? getPhotoDimensions(portrait) : null;

  return (
    <section className="mx-auto w-full max-w-5xl px-5 pb-28 pt-14 sm:px-8 sm:pt-20 lg:px-10">
      <h1 className="font-serif text-5xl tracking-[0.16em] sm:text-6xl">ABOUT</h1>
      <div className="mt-16 grid items-start gap-16 lg:mt-24 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-6">
          <p className="max-w-md whitespace-pre-line font-serif text-2xl leading-snug tracking-wide sm:text-[1.85rem]">
            {site.about.lead}
          </p>
          <p className="mt-10 max-w-sm whitespace-pre-line text-[15px] leading-relaxed text-text-secondary">
            {site.about.aside}
          </p>
          <HandwrittenNote className="mt-12 text-muted">
            {"nothing serious,\njust things I wanted to keep."}
          </HandwrittenNote>
          <p className="mt-20 font-mono text-[10px] tracking-[0.18em] text-muted">
            Based in {site.location}
          </p>
          <div className="mt-5 flex flex-col gap-2 text-[14px] tracking-wide">
            <a href={site.instagramUrl} className="hover:text-olive">
              {site.instagramLabel}
            </a>
            <a href={`mailto:${site.email}`} className="hover:text-olive">
              {site.email}
            </a>
          </div>
          <p className="mt-12 font-mono text-[10px] tracking-[0.16em] text-muted">
            camera:
            <br />
            {site.about.camera}
          </p>
        </div>
        {portrait && dimensions ? (
          <figure className="photo-print w-full max-w-xs lg:col-span-4 lg:col-start-9 lg:mt-10">
            <Image
              src={getPhotoSrc(portrait)}
              alt={getPhotoAlt(portrait)}
              width={dimensions.width}
              height={dimensions.height}
              quality={95}
              sizes="(max-width: 1024px) 80vw, 28vw"
              className="h-auto w-full"
              style={{ height: "auto" }}
            />
          </figure>
        ) : null}
      </div>
    </section>
  );
}
