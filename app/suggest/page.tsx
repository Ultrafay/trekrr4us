import { createClient } from "@/lib/supabase-server";
import { getAllowlist, getProfile } from "@/lib/allowlist";
import ItemCard, { Item } from "@/components/ItemCard";

export const dynamic = "force-dynamic";

export default async function Suggest() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const me = getProfile(user?.email);
  const other = getAllowlist().find((p) => p.email !== user?.email);

  // What the OTHER person added (suggestions for me)
  const { data: forMe } = await supabase
    .from("items")
    .select("*")
    .neq("added_by", user?.email || "")
    .eq("status", "want")
    .order("created_at", { ascending: false });

  // What I added (suggestions for them)
  const { data: forThem } = await supabase
    .from("items")
    .select("*")
    .eq("added_by", user?.email || "")
    .eq("status", "want")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink-800 mb-2">Between us</h1>
      <p className="font-serif italic text-ink-400 mb-6">
        what you&apos;ve added for each other
      </p>

      <section className="mb-10">
        <h2 className="font-serif text-xl text-ink-800 mb-3">
          From {other?.name} {other?.emoji} <span className="text-sm text-ink-400">→ you</span>
        </h2>
        {!forMe || forMe.length === 0 ? (
          <div className="card-paper p-6 text-center">
            <p className="font-serif italic text-ink-400">Nothing waiting yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {forMe.map((i) => <ItemCard key={i.id} item={i as Item} />)}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-serif text-xl text-ink-800 mb-3">
          From you <span className="text-sm text-ink-400">→ {other?.name} {other?.emoji}</span>
        </h2>
        {!forThem || forThem.length === 0 ? (
          <div className="card-paper p-6 text-center">
            <p className="font-serif italic text-ink-400">
              You haven&apos;t added anything for them yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {forThem.map((i) => <ItemCard key={i.id} item={i as Item} />)}
          </div>
        )}
      </section>
    </div>
  );
}
