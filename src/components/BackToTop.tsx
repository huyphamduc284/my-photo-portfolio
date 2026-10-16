"use client";

import { useEffect, useState } from "react";

const SHOW_AFTER = 750;

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sync = () => setLightboxOpen(document.documentElement.dataset.lightbox === "open");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-lightbox"],
    });
    return () => observer.disconnect();
  }, []);

  function scrollTop() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  const shown = visible && !lightboxOpen;

  return (
    <button
      type="button"
      onClick={scrollTop}
      aria-label="Back to top"
      className={`fixed right-4 bottom-4 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-text/35 bg-background text-[13px] text-text transition-all duration-200 hover:border-text hover:opacity-100 md:right-7 md:bottom-7 md:h-10 md:w-10 ${
        shown ? "translate-y-0 opacity-70" : "pointer-events-none translate-y-1 opacity-0"
      }`}
    >
      ↑
    </button>
  );
}
