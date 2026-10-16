"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setMessage("couldn't sign in.\ncheck your email and password.");
        setBusy(false);
        return;
      }
      window.location.assign("/admin");
    } catch {
      setMessage("couldn't sign in.\ncheck your email and password.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-16 max-w-md">
      <div className="border-t border-line/80 pt-10">
        <label htmlFor="email" className="desk-label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="desk-input"
        />
      </div>

      <div className="mt-8">
        <label htmlFor="password" className="desk-label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="desk-input"
        />
      </div>

      <button
        type="submit"
        disabled={busy}
        aria-busy={busy}
        className="desk-btn login-btn mt-12"
      >
        {busy ? (
          "signing in..."
        ) : (
          <>
            sign in
            <span aria-hidden="true">→</span>
          </>
        )}
      </button>

      {message ? (
        <p className="desk-status desk-status-error mt-8 whitespace-pre-line" role="alert">
          {message}
        </p>
      ) : null}

      <p className="mt-8 font-mono text-[10px] tracking-[0.18em] text-muted">
        just for the archive keeper.
      </p>
    </form>
  );
}
