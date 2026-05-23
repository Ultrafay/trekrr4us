import { createClient } from "@/lib/supabase-server";
import { getAllowlist, getProfile } from "@/lib/allowlist";
import ItemCard, { Item } from "@/components/ItemCard";

export const dynamic = "force-dynamic";

export default async function Suggest() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const me = getProfile(user?.email);
  const other = getAllowlist().find((p) => p.email !== user?.email);
  const profiles = getAllowlist();

  let forMe: any[] = [];
  let forThem: any[] = [];

  if (other) {
    // Items added by other person where their progress is still 'want'
    const { data: otherWant } = await supabase
      .from("item_progress")
      .select("item_id")
      .eq("user_email", other.email)
      .eq("status", "want");
    const otherWantIds = (otherWant || []).map((p: any) => p.item_id);

    if (otherWantIds.length > 0) {
      const { data } = await supabase
        .from("items")
        .select("*, item_progress(*)")
        .eq("added_by", other.email)
        .in("id", otherWantIds)
        .order("created_at", { ascending: false });
      forMe = data || [];
    }

    // Items added by current user where their progress is still 'want'
    const { data: myWant } = await supabase
      .from("item_progress")
      .select("item_id")
      .eq("user_email", user?.email || "")
      .eq("status", "want");
    const myWantIds = (myWant || []).map((p: any) => p.item_id);

    if (myWantIds.length > 0) {
      const { data } = await supabase
        .from("items")
        .select("*, item_progress(*)")
        .eq("added_by", user?.email || "")
        .in("id", myWantIds)
        .order("created_at", { ascending: false });
      forThem = data || [];
    }
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink-800 mb-2">Between us</h1>
      <p className="font-serif italic text-ink-400 mb-6">
        what you&apos;ve added for each other
      </p>

      <section className="mb-10">
        <h2 className="font-serif text-xl text-ink-800 mb-3">
          From {other?.name} {other?.emoji}{" "}
          <span className="text-sm text-ink-400">→ you</span>
        </h2>
        {forMe.length === 0 ? (
          <div className="card-paper p-6 text-center">
            <p className="font-serif italic text-ink-400">Nothing waiting yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {forMe.map((i) => (
              <ItemCard
                key={i.id}
                item={i as Item}
                currentUserEmail={user?.email || ""}
                currentUserName={me?.name || ""}
                profiles={profiles}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-serif text-xl text-ink-800 mb-3">
          From you{" "}
          <span className="text-sm text-ink-400">
            → {other?.name} {other?.emoji}
          </span>
        </h2>
        {forThem.length === 0 ? (
          <div className="card-paper p-6 text-center">
            <p className="font-serif italic text-ink-400">
              You haven&apos;t added anything for them yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {forThem.map((i) => (
              <ItemCard
                key={i.id}
                item={i as Item}
                currentUserEmail={user?.email || ""}
                currentUserName={me?.name || ""}
                profiles={profiles}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
