import { createClient } from "@/lib/supabase-server";
import ItemCard, { Item } from "@/components/ItemCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "all", label: "All" },
  { key: "movie", label: "Films" },
  { key: "series", label: "Series" },
  { key: "book", label: "Books" },
  { key: "want", label: "Want" },
  { key: "in_progress", label: "In progress" },
  { key: "done", label: "Done" },
];

export default async function Library({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const filter = searchParams.filter || "all";
  const supabase = createClient();
  let query = supabase.from("items").select("*").order("created_at", { ascending: false });
  if (["movie", "series", "book"].includes(filter)) {
    query = query.eq("type", filter);
  } else if (["want", "in_progress", "done"].includes(filter)) {
    query = query.eq("status", filter);
  }
  const { data: items } = await query;

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink-800 mb-2">The library</h1>
      <p className="font-serif italic text-ink-400 mb-6">everything, all at once</p>

      <div className="flex gap-1 overflow-x-auto border-b border-paper-300 mb-6">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/library?filter=${t.key}`}
            className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px ${
              filter === t.key
                ? "border-ink-800 text-ink-800"
                : "border-transparent text-ink-400 hover:text-ink-600"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {!items || items.length === 0 ? (
        <div className="card-paper p-8 text-center">
          <p className="font-serif italic text-ink-400">Nothing in this view.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((i) => <ItemCard key={i.id} item={i as Item} />)}
        </div>
      )}
    </div>
  );
}
