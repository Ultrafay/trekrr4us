import { createClient } from "@/lib/supabase-server";
import { getAllowlist, getProfile } from "@/lib/allowlist";
import ItemCard, { Item } from "@/components/ItemCard";

export const dynamic = "force-dynamic";

export default async function Me() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const me = getProfile(user?.email);
  const profiles = getAllowlist();

  // Fetch current user's progress rows (for stats + item filtering)
  const { data: myProgress } = await supabase
    .from("item_progress")
    .select("item_id, status, rating")
    .eq("user_email", user?.email || "");

  const itemIds = (myProgress || []).map((p: any) => p.item_id);

  let items: any[] = [];
  if (itemIds.length > 0) {
    const { data } = await supabase
      .from("items")
      .select("*, item_progress(*)")
      .in("id", itemIds)
      .order("created_at", { ascending: false });
    items = data || [];
  }

  // Organise by this user's status
  const progressMap = Object.fromEntries(
    (myProgress || []).map((p: any) => [p.item_id, p])
  );
  const finished = items.filter((i) => progressMap[i.id]?.status === "done");
  const inProgress = items.filter((i) => progressMap[i.id]?.status === "in_progress");
  const want = items.filter((i) => progressMap[i.id]?.status === "want");

  const ratedFinished = finished.filter((i) => progressMap[i.id]?.rating);
  const avg =
    ratedFinished.reduce((s: number, i: any) => s + (progressMap[i.id]?.rating || 0), 0) /
    (ratedFinished.length || 1);

  return (
    <div>
      <div className="text-center mb-10">
        <p className="font-hand text-3xl text-accent-rose">
          {me?.name} {me?.emoji}
        </p>
        <p className="font-serif italic text-ink-400 mt-1">your shelf</p>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-10">
        <Stat label="Added" v={String(items.length)} />
        <Stat label="Done" v={String(finished.length)} />
        <Stat label="Going" v={String(inProgress.length)} />
        <Stat label="Avg ★" v={ratedFinished.length ? avg.toFixed(1) : "—"} />
      </div>

      {inProgress.length > 0 && (
        <Section title="Currently">
          {inProgress.map((i) => (
            <ItemCard
              key={i.id}
              item={i as Item}
              currentUserEmail={user?.email || ""}
              currentUserName={me?.name || ""}
              profiles={profiles}
            />
          ))}
        </Section>
      )}
      {finished.length > 0 && (
        <Section title="Finished">
          {finished.map((i) => (
            <ItemCard
              key={i.id}
              item={i as Item}
              currentUserEmail={user?.email || ""}
              currentUserName={me?.name || ""}
              profiles={profiles}
            />
          ))}
        </Section>
      )}
      {want.length > 0 && (
        <Section title="Queued">
          {want.map((i) => (
            <ItemCard
              key={i.id}
              item={i as Item}
              currentUserEmail={user?.email || ""}
              currentUserName={me?.name || ""}
              profiles={profiles}
            />
          ))}
        </Section>
      )}

      {items.length === 0 && (
        <div className="card-paper p-8 text-center">
          <p className="font-serif italic text-ink-400">
            Your shelf is empty — head to Add to get started.
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, v }: { label: string; v: string }) {
  return (
    <div className="card-paper p-3 text-center">
      <div className="font-serif text-2xl text-ink-800">{v}</div>
      <div className="text-[10px] uppercase tracking-wider text-ink-400">{label}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="font-serif text-xl text-ink-800 mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
