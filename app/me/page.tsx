import { createClient } from "@/lib/supabase-server";
import { getProfile } from "@/lib/allowlist";
import ItemCard, { Item } from "@/components/ItemCard";

export const dynamic = "force-dynamic";

export default async function Me() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const me = getProfile(user?.email);

  const { data: mine } = await supabase
    .from("items")
    .select("*")
    .eq("added_by", user?.email || "")
    .order("created_at", { ascending: false });

  const finished = mine?.filter((i) => i.status === "done") || [];
  const inProgress = mine?.filter((i) => i.status === "in_progress") || [];
  const want = mine?.filter((i) => i.status === "want") || [];

  const avg =
    finished.filter((i) => i.rating).reduce((s, i) => s + (i.rating || 0), 0) /
    (finished.filter((i) => i.rating).length || 1);

  return (
    <div>
      <div className="text-center mb-10">
        <p className="font-hand text-3xl text-accent-rose">
          {me?.name} {me?.emoji}
        </p>
        <p className="font-serif italic text-ink-400 mt-1">your shelf</p>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-10">
        <Stat label="Added" v={String(mine?.length || 0)} />
        <Stat label="Done" v={String(finished.length)} />
        <Stat label="Going" v={String(inProgress.length)} />
        <Stat label="Avg ★" v={avg ? avg.toFixed(1) : "—"} />
      </div>

      {inProgress.length > 0 && (
        <Section title="Currently">
          {inProgress.map((i) => <ItemCard key={i.id} item={i as Item} />)}
        </Section>
      )}
      {finished.length > 0 && (
        <Section title="Finished">
          {finished.map((i) => <ItemCard key={i.id} item={i as Item} />)}
        </Section>
      )}
      {want.length > 0 && (
        <Section title="Queued">
          {want.map((i) => <ItemCard key={i.id} item={i as Item} />)}
        </Section>
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
