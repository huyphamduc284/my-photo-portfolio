import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

function LoginBotanical() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 28 48"
      className="h-16 w-7 text-olive/35"
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

export default function LoginPage() {
  return (
    <section className="login-page mx-auto w-full max-w-6xl px-5 pb-28 pt-14 sm:px-8 sm:pt-20 lg:px-10">
      <div className="grid items-start gap-16 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <header className="animate-fade-up max-w-lg">
            <h1 className="font-serif text-[2.75rem] tracking-[0.14em] sm:text-[3.45rem]">
              SIGN IN
            </h1>
            <p className="mt-5 font-serif text-2xl leading-snug text-text-secondary">
              a small private corner.
            </p>
          </header>
          <LoginForm />
        </div>
        <aside
          className="hidden justify-end pt-8 lg:col-span-4 lg:col-start-9 lg:flex lg:pt-20"
          aria-hidden="true"
        >
          <LoginBotanical />
        </aside>
      </div>
    </section>
  );
}
