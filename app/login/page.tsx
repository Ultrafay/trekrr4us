"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    // Server-side allowlist check first
    const check = await fetch("/api/auth/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!check.ok) {
      setErr("This email is not allowed.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setErr(error.message);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="max-w-md mx-auto pt-16 text-center">
      <div className="ornament mb-2">✦ &nbsp;❖&nbsp; ✦</div>
      <h1 className="font-serif text-4xl text-ink-800 mb-2">Our Library</h1>
      <p className="font-serif italic text-ink-400 mb-10">
        a small library, just for two
      </p>

      <form onSubmit={signIn} className="card-paper p-6 text-left">
        <label className="text-xs uppercase tracking-wider text-ink-400 mb-2 block">
          Email
        </label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="paper-input mb-4"
        />

        <label className="text-xs uppercase tracking-wider text-ink-400 mb-2 block">
          Password
        </label>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="paper-input mb-4"
        />

        <button type="submit" disabled={loading} className="btn-ink w-full">
          {loading ? "Signing in…" : "Sign in"}
        </button>

        {err && <p className="text-sm text-accent-rose mt-3">{err}</p>}

        <p className="text-xs text-ink-200 mt-6 text-center font-hand text-base">
          only Spideyyy 🕷️ &amp; Muuunn 🌙
        </p>
      </form>
    </div>
  );
}
