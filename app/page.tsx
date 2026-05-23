import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { getAllowlist, getProfile } from "@/lib/allowlist";
import ItemCard, { Item } from "@/components/ItemCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = getProfile(user?.email);
  const profiles = getAllowlist();

  const { data: items } = await supabase
    .from("items")
    .select("*, item_progress(*)")
    .order("created_at", { ascending: false })
    .limit(20);

  const all = items || [];
  const counts = {
    movies: all.filter((i) => i.type === "movie").length,
    series: all.filter((i) => i.type === "series").length,
    books: all.filter((i) => i.type === "book").length,
  };

  return (
    <div>
      <div className="text-center mb-8 pt-2">
        <p className="font-hand text-xl sm:text-2xl text-accent-rose">
          welcome back, {profile?.name} {profile?.emoji}
        </p>
        <p className="font-serif italic text-ink-400 mt-1 text-sm sm:text-base">
          {all.length > 0
            ? `${all.length} ${all.length === 1 ? "entry" : "entries"} in your library`
            : "your library is empty — add the first one"}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-8">
        <Stat label="Films" count={counts.movies} />
        <Stat label="Series" count={counts.series} />
        <Stat label="Books" count={counts.books} />
      </div>

      <div className="flex justify-between items-baseline mb-3">
        <h2 className="font-serif text-xl sm:text-2xl text-ink-800">Recent</h2>
        <Link href="/search" className="btn-ink text-xs">
          + Add
        </Link>
      </div>

      {all.length === 0 ? (
        <div className="card-paper p-6 sm:p-8 text-center">
          <p className="font-serif italic text-ink-400">
            Nothing here yet. Tap &ldquo;Add&rdquo; above to begin.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {all.map((i) => (
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

function Stat({ label, count }: { label: string; count: number }) {
  return (
    <div className="card-paper p-3 sm:p-4 text-center">
      <div className="font-serif text-2xl sm:text-3xl text-ink-800">{count}</div>
      <div className="text-[10px] sm:text-xs uppercase tracking-wider text-ink-400 mt-0.5 sm:mt-1">
        {label}
      </div>
    </div>
  );
}
