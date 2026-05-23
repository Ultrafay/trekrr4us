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
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null);

  // On mount: load user + pre-populate already-added external_ids
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) return;

      const pres = await fetch(`/api/profile?email=${encodeURIComponent(user.email)}`);
      const p = await pres.json();
      setCurrentUser({ email: user.email, name: p.name || user.email });

      // Fetch external_ids the user already has in their progress
      const { data: progress } = await supabase
        .from("item_progress")
        .select("item_id, items(external_id)")
        .eq("user_email", user.email);
      const ids = new Set(
        (progress || []).map((r: any) => r.items?.external_id).filter(Boolean)
      );
      setAddedIds(ids);
    })();
  }, []);

  // Search with 300ms debounce
  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q)}&type=${type}`
        );
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
    if (!currentUser) {
      setError("Still loading profile, please wait…");
      return;
    }
    setError(null);
    setAdding(r.external_id);
    setAddedIds((s) => new Set(s).add(r.external_id)); // optimistic

    const supabase = createClient();
    try {
      // Check if item already exists by external_id
      const { data: existing } = await supabase
        .from("items")
        .select("id")
        .eq("external_id", r.external_id)
        .maybeSingle();

      let itemId: string;

      if (existing) {
        // Item exists — check if current user already has a progress row
        const { data: existingProgress } = await supabase
          .from("item_progress")
          .select("id")
          .eq("item_id", existing.id)
          .eq("user_email", currentUser.email)
          .maybeSingle();
        if (existingProgress) {
          // Already in their list, nothing to do
          setAdding(null);
          return;
        }
        itemId = existing.id;
      } else {
        // Insert new shared item row
        const { data: newItem, error: itemErr } = await supabase
          .from("items")
          .insert({
            title: r.title,
            type: r.type,
            year: r.year,
            cover_url: r.cover_url,
            external_id: r.external_id,
            added_by: currentUser.email,
            added_by_name: currentUser.name,
          })
          .select("id")
          .single();
        if (itemErr) throw itemErr;
        itemId = newItem.id;
      }

      // Insert progress row for the current user
      const { error: progressErr } = await supabase.from("item_progress").insert({
        item_id: itemId,
        user_email: currentUser.email,
        user_name: currentUser.name,
        status: "want",
      });
      if (progressErr) throw progressErr;

      router.refresh();
    } catch (e: any) {
      setAddedIds((s) => {
        const n = new Set(s);
        n.delete(r.external_id);
        return n;
      });
      setError(`Could not add: ${e.message}`);
    } finally {
      setAdding(null);
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
        <div className="card-paper p-3 mb-4">
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
                    <span className="text-ink-200 text-xs sm:text-sm ml-2">({r.year})</span>
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
                  isAdded ? "bg-accent-moss text-paper-50" : "btn-ink"
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
