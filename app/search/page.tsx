"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

type Result = {
  external_id: string;
  type: "movie" | "series" | "book";
  title: string;
  year: string | null;
  cover_url: string | null;
  description: string | null;
};

const TYPES = [
  { key: "all", label: "All" },
  { key: "movie", label: "Films" },
  { key: "series", label: "Series" },
  { key: "book", label: "Books" },
] as const;

export default function SearchPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]["key"]>("all");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${type}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [q, type]);

  async function add(r: Result) {
    setError(null);
    setAdding(r.external_id);
    // Optimistic: mark as added immediately
    setAddedIds((s) => new Set(s).add(r.external_id));

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const email = user?.email;

    if (!email) {
      setError("Not signed in. Reload the page.");
      setAdding(null);
      setAddedIds((s) => {
        const n = new Set(s);
        n.delete(r.external_id);
        return n;
      });
      return;
    }

    // Get name from session metadata or just derive from email
    let name = "User";
    try {
      const pres = await fetch(`/api/profile?email=${encodeURIComponent(email)}`);
      const p = await pres.json();
      name = p.name || email;
    } catch {}

    const { error: insertError } = await supabase.from("items").insert({
      title: r.title,
      type: r.type,
      year: r.year,
      cover_url: r.cover_url,
      external_id: r.external_id,
      status: "want",
      added_by: email,
      added_by_name: name,
    });

    setAdding(null);

    if (insertError) {
      // Rollback optimistic update
      setAddedIds((s) => {
        const n = new Set(s);
        n.delete(r.external_id);
        return n;
      });
      setError(`Could not add: ${insertError.message}`);
    } else {
      router.refresh();
    }
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink-800 mb-2">Add</h1>
      <p className="font-serif italic text-ink-400 mb-5 text-sm">
        search films, series, and books — tap to add
      </p>

      <div className="card-paper p-3 mb-5">
        <input
          autoFocus
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type a title…"
          className="paper-input mb-3"
        />
        <div className="flex gap-1.5 flex-wrap">
          {TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                type === t.key
                  ? "bg-ink-800 text-paper-50 border-ink-800"
                  : "border-paper-400 text-ink-400 hover:border-ink-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="card-paper p-3 mb-4 border-accent-rose">
          <p className="text-sm text-accent-rose">{error}</p>
        </div>
      )}

      {loading && (
        <p className="text-center text-ink-400 italic font-serif text-sm py-4">
          searching…
        </p>
      )}

      {!loading && q && results.length === 0 && (
        <p className="text-center text-ink-400 italic font-serif text-sm py-4">
          No results.
        </p>
      )}

      <div className="space-y-2">
        {results.map((r) => {
          const isAdded = addedIds.has(r.external_id);
          const isAdding = adding === r.external_id;
          return (
            <div key={r.external_id} className="card-paper p-3 flex gap-3">
              <div className="w-12 h-16 sm:w-14 sm:h-20 flex-shrink-0 bg-paper-200 rounded overflow-hidden">
                {r.cover_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.cover_url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-base sm:text-lg text-ink-800 leading-tight">
                  {r.title}
                  {r.year && (
                    <span className="text-ink-200 text-xs sm:text-sm ml-2">
                      ({r.year})
                    </span>
                  )}
                </h3>
                <div className="text-xs text-ink-400 capitalize">{r.type}</div>
                {r.description && (
                  <p className="text-xs text-ink-400 mt-1 line-clamp-2 hidden sm:block">
                    {r.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => add(r)}
                disabled={isAdding || isAdded}
                className={`text-xs self-center px-3 py-2 rounded transition-all ${
                  isAdded
                    ? "bg-accent-moss text-paper-50"
                    : "btn-ink"
                }`}
              >
                {isAdded ? "Added ✓" : isAdding ? "…" : "Add"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
