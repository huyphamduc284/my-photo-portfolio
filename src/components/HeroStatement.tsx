import { site } from "@/data/site";
import HandwrittenNote from "@/components/HandwrittenNote";

function TinyLeaf() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 28 48"
      className="mt-8 h-11 w-5 text-olive/45"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.75"
    >
      <path d="M14 46 C14 30 8 24 8 14 C8 8 12 4 14 2 C16 4 20 8 20 14 C20 24 14 30 14 46" />
      <path d="M14 22 C10 20 7 16 7 12" />
      <path d="M14 26 C18 24 21 19 21 14" />
    </svg>
  );
}

export default function HeroStatement() {
  return (
    <div className="lg:pt-6">
      <h1 className="font-serif text-[2.05rem] font-medium leading-[1.12] tracking-wide text-text sm:text-[2.65rem] lg:text-[2.9rem]">
        {site.introLines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </h1>
      <HandwrittenNote className="mt-8 max-w-[9rem] text-muted">
        {site.heroNote}
      </HandwrittenNote>
      <TinyLeaf />
    </div>
  );
}
