import { createClient } from "@/lib/supabase-server";
import { getAllowlist, getProfile } from "@/lib/allowlist";
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = getProfile(user?.email);
  const profiles = getAllowlist();

  let items: any[] = [];

  if (["movie", "series", "book"].includes(filter)) {
    const { data } = await supabase
      .from("items")
      .select("*, item_progress(*)")
      .eq("type", filter)
      .order("created_at", { ascending: false });
    items = data || [];
  } else if (["want", "in_progress", "done"].includes(filter)) {
    // Two-step: find item IDs with this status (any user), then fetch with full progress
    const { data: matchingProgress } = await supabase
      .from("item_progress")
      .select("item_id")
      .eq("status", filter);
    const itemIds = [...new Set((matchingProgress || []).map((p: any) => p.item_id))];
    if (itemIds.length > 0) {
      const { data } = await supabase
        .from("items")
        .select("*, item_progress(*)")
        .in("id", itemIds)
        .order("created_at", { ascending: false });
      items = data || [];
    }
  } else {
    const { data } = await supabase
      .from("items")
      .select("*, item_progress(*)")
      .order("created_at", { ascending: false });
    items = data || [];
  }

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

      {items.length === 0 ? (
        <div className="card-paper p-8 text-center">
          <p className="font-serif italic text-ink-400">Nothing in this view.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((i) => (
            <ItemCard
              key={i.id}
              item={i as Item}
              currentUserEmail={user?.email || ""}
              currentUserName={profile?.name || ""}
              profiles={profiles}
            />
          ))}
        </div>
      )}
    </div>
  );
}
