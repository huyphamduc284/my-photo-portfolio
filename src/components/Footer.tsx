import { site } from "@/data/site";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-line/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-8 lg:px-10">
        <div>
          <p className="font-serif text-lg tracking-wide">{site.name}</p>
          <p className="mt-1 font-mono text-[10px] tracking-[0.18em] text-muted">
            {site.year}
          </p>
          <p className="mt-4 max-w-[12rem] font-serif text-lg leading-snug text-text-secondary">
            random photos, places, people, and other good things.
          </p>
        </div>
        <div className="flex gap-6 font-mono text-[10px] tracking-[0.18em] text-muted">
          <a href={site.instagramUrl} className="hover:text-text">
            {site.instagramLabel}
          </a>
          <a href={`mailto:${site.email}`} className="hover:text-text">
            Email
          </a>
        </div>
      </div>
    </footer>
  );
}
