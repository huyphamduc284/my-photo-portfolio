import { Suspense } from "react";
import type { Metadata } from "next";
import AdminDesk from "@/components/AdminDesk";

export const metadata: Metadata = {
  title: "Archive desk",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 pb-28 pt-14 sm:px-8 sm:pt-20 lg:px-10">
      <header className="animate-fade-up max-w-lg">
        <h1 className="font-serif text-5xl tracking-[0.12em] sm:text-6xl">
          ARCHIVE DESK
        </h1>
        <p className="mt-5 font-serif text-2xl leading-snug text-text-secondary">
          a quiet place to add and manage photographs.
        </p>
      </header>
      <Suspense fallback={<div className="h-40" aria-hidden="true" />}>
        <AdminDesk />
      </Suspense>
    </section>
  );
}
