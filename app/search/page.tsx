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
  { key: "all", label: "Everything" },
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

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${type}`);
      const data = await res.json();
      setResults(data.results || []);
      setLoading(false);
    }, 350);
    return () => clearTimeout(t);
  }, [q, type]);

  async function add(r: Result) {
    setAdding(r.external_id);
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    const email = user?.user?.email;
    const profileRes = await fetch(`/api/profile?email=${email}`);
    const profile = await profileRes.json();
    const { error } = await supabase.from("items").insert({
      title: r.title,
      type: r.type,
      year: r.year,
      cover_url: r.cover_url,
      external_id: r.external_id,
      status: "want",
      added_by: email,
      added_by_name: profile.name,
    });
    setAdding(null);
    if (!error) {
      setAddedIds((s) => new Set(s).add(r.external_id));
      router.refresh();
    }
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink-800 mb-2">Add to library</h1>
      <p className="font-serif italic text-ink-400 mb-6">
        search films, series, and books — tap to add
      </p>

      <div className="card-paper p-4 mb-6">
        <input
          autoFocus
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type a title…"
          className="paper-input mb-3"
        />
        <div className="flex gap-2 flex-wrap">
          {TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              className={`text-xs px-3 py-1 rounded-full border ${
                type === t.key
                  ? "bg-ink-800 text-paper-50 border-ink-800"
                  : "border-paper-400 text-ink-400"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-center text-ink-400 italic font-serif">searching…</p>}

      {!loading && q && results.length === 0 && (
        <p className="text-center text-ink-400 italic font-serif">No results.</p>
      )}

      <div className="space-y-2">
        {results.map((r) => (
          <div key={r.external_id} className="card-paper p-3 flex gap-3">
            <div className="w-14 h-20 flex-shrink-0 bg-paper-200 rounded overflow-hidden">
              {r.cover_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.cover_url} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-lg text-ink-800 leading-tight">
                {r.title}
                {r.year && <span className="text-ink-200 text-sm ml-2">({r.year})</span>}
              </h3>
              <div className="text-xs text-ink-400 capitalize">{r.type}</div>
              {r.description && (
                <p className="text-xs text-ink-400 mt-1 line-clamp-2">{r.description}</p>
              )}
            </div>
            <button
              onClick={() => add(r)}
              disabled={adding === r.external_id || addedIds.has(r.external_id)}
              className="btn-ink text-xs self-center"
            >
              {addedIds.has(r.external_id) ? "Added ✓" : adding === r.external_id ? "…" : "Add"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
