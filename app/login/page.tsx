"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    // Server-side allowlist check
    const check = await fetch("/api/auth/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!check.ok) {
      setErr("This email is not on the allowlist.");
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) {
      setErr(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="max-w-md mx-auto pt-16 text-center">
      <div className="ornament mb-2">✦ &nbsp;❖&nbsp; ✦</div>
      <h1 className="font-serif text-4xl text-ink-800 mb-2">Our Library</h1>
      <p className="font-serif italic text-ink-400 mb-10">
        a small library, just for two
      </p>

      {sent ? (
        <div className="card-paper p-6">
          <p className="font-serif text-lg text-ink-800 mb-2">Check your email.</p>
          <p className="text-sm text-ink-400">
            Tap the magic link we sent to <strong>{email}</strong>.
          </p>
        </div>
      ) : (
        <form onSubmit={send} className="card-paper p-6 text-left">
          <label className="text-xs uppercase tracking-wider text-ink-400 mb-2 block">
            Your email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="paper-input mb-4"
          />
          <button type="submit" disabled={loading} className="btn-ink w-full">
            {loading ? "Sending…" : "Send magic link"}
          </button>
          {err && <p className="text-sm text-accent-rose mt-3">{err}</p>}
          <p className="text-xs text-ink-200 mt-4 text-center font-hand text-base">
            only Spideyyy 🕷️ &amp; Muuunn 🌙
          </p>
        </form>
      )}
    </div>
  );
}
