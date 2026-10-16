"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { site } from "@/data/site";
import HandwrittenNote from "@/components/HandwrittenNote";
import { createClient } from "@/lib/supabase/client";

const publicLinks = [
  { href: "/journal", label: "Journal" },
  { href: "/archive", label: "Archive" },
  { href: "/about", label: "About" },
];

const adminLink = { href: "/admin", label: "Admin" };

function BotanicalMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 28 48"
      className="hidden h-10 w-5 text-olive/50 lg:block"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.8"
    >
      <path d="M14 46 C14 30 8 24 8 14 C8 8 12 4 14 2 C16 4 20 8 20 14 C20 24 14 30 14 46" />
      <path d="M14 22 C10 20 7 16 7 12" />
      <path d="M14 26 C18 24 21 19 21 14" />
    </svg>
  );
}

export default function Header() {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      setSignedIn(Boolean(data.user));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user));
    });

    return () => subscription.unsubscribe();
  }, []);

  const links = signedIn ? [...publicLinks, adminLink] : publicLinks;

  return (
    <header className="border-b border-line/80">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-end gap-6 px-5 py-7 sm:px-8 lg:grid-cols-[1fr_auto_1fr] lg:gap-8 lg:px-10 lg:py-9">
        <Link href="/" className="max-w-[14rem]">
          <span className="font-serif text-[1.65rem] leading-none tracking-wide text-text">
            {site.name}
          </span>
          <span className="mt-2 block font-mono text-[9px] leading-relaxed tracking-[0.22em] text-muted">
            {site.subtitleLines[0]}
            <br />
            {site.subtitleLines[1]}
          </span>
        </Link>

        <nav aria-label="Primary">
          <ul className="flex flex-wrap gap-x-7 gap-y-2">
            {links.map((link) => {
              const active =
                pathname === link.href || pathname.startsWith(`${link.href}/`);

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`text-[13px] tracking-wide transition-colors ${
                      active
                        ? "text-text underline decoration-olive/70 underline-offset-[10px]"
                        : "text-text-secondary hover:text-text"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden items-end justify-end gap-4 lg:flex">
          <HandwrittenNote className="text-right text-[1.05rem] text-muted">
            {site.headerNote}
          </HandwrittenNote>
          <BotanicalMark />
        </div>
      </div>
    </header>
  );
}
