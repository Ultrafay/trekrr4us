import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { getProfile } from "@/lib/allowlist";
import ItemCard, { Item } from "@/components/ItemCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = getProfile(user?.email);

  const { data: items } = await supabase
    .from("items")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(12);

  const counts = {
    movies: items?.filter((i) => i.type === "movie").length || 0,
    series: items?.filter((i) => i.type === "series").length || 0,
    books: items?.filter((i) => i.type === "book").length || 0,
  };

  return (
    <div>
      <div className="text-center mb-10 pt-4">
        <p className="font-hand text-2xl text-accent-rose">
          welcome back, {profile?.name} {profile?.emoji}
        </p>
        <p className="font-serif italic text-ink-400 mt-1">
          {items && items.length > 0
            ? `${items.length} entries in your library`
            : "your library is empty — add the first one"}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-10">
        <Stat label="Films" count={counts.movies} />
        <Stat label="Series" count={counts.series} />
        <Stat label="Books" count={counts.books} />
      </div>

      <div className="flex justify-between items-baseline mb-4">
        <h2 className="font-serif text-2xl text-ink-800">Recent</h2>
        <Link href="/search" className="btn-ink text-xs">Add new</Link>
      </div>

      {!items || items.length === 0 ? (
        <div className="card-paper p-8 text-center">
          <p className="font-serif italic text-ink-400">
            Nothing here yet. Tap &ldquo;Add new&rdquo; above to begin.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((i) => <ItemCard key={i.id} item={i as Item} />)}
        </div>
      )}
    </div>
  );
}

function Stat({ label, count }: { label: string; count: number }) {
  return (
    <div className="card-paper p-4 text-center">
      <div className="font-serif text-3xl text-ink-800">{count}</div>
      <div className="text-xs uppercase tracking-wider text-ink-400 mt-1">{label}</div>
    </div>
  );
}
