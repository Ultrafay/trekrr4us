"use client";
import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

type Status = "want" | "in_progress" | "done";

export type Item = {
  id: string;
  title: string;
  type: "movie" | "series" | "book";
  status: Status;
  rating: number | null;
  note: string | null;
  cover_url: string | null;
  year: string | null;
  added_by: string;
  added_by_name: string;
  created_at: string;
};

const TYPE_LABEL: Record<Item["type"], string> = {
  movie: "Film",
  series: "Series",
  book: "Book",
};

const STATUS_LABEL: Record<Status, string> = {
  want: "Want",
  in_progress: "In progress",
  done: "Done",
};

function ProgressFor(type: Item["type"]): string {
  return type === "book" ? "Reading" : "Watching";
}

export default function ItemCard({ item, onChange }: { item: Item; onChange?: () => void }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(item.rating || 0);
  const [note, setNote] = useState(item.note || "");

  async function setStatus(status: Status) {
    const supabase = createClient();
    start(async () => {
      await supabase.from("items").update({ status }).eq("id", item.id);
      router.refresh();
      onChange?.();
    });
  }

  async function saveReview() {
    const supabase = createClient();
    start(async () => {
      await supabase
        .from("items")
        .update({ status: "done", rating, note })
        .eq("id", item.id);
      setEditing(false);
      router.refresh();
      onChange?.();
    });
  }

  async function remove() {
    if (!confirm("Remove this from the library?")) return;
    const supabase = createClient();
    start(async () => {
      await supabase.from("items").delete().eq("id", item.id);
      router.refresh();
      onChange?.();
    });
  }

  return (
    <div className="card-paper p-4 flex gap-4">
      <div className="w-20 h-28 flex-shrink-0 bg-paper-200 rounded overflow-hidden">
        {item.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.cover_url} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-paper-500 text-xs">
            no cover
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-serif text-xl text-ink-800 leading-tight">
              {item.title}
              {item.year && <span className="text-ink-200 text-sm ml-2">({item.year})</span>}
            </h3>
            <div className="text-xs text-ink-400 mt-0.5">
              {TYPE_LABEL[item.type]} · {STATUS_LABEL[item.status]}
            </div>
          </div>
          <span
            className={`stamp ${item.added_by_name?.toLowerCase().includes("muu") ? "muun" : "spidey"}`}
          >
            {item.added_by_name}
          </span>
        </div>

        {item.rating ? (
          <div className="text-amber-700 text-sm mt-2 tracking-widest">
            {"★".repeat(item.rating)}
            <span className="text-paper-400">{"★".repeat(5 - item.rating)}</span>
          </div>
        ) : null}

        {item.note && (
          <p className="font-serif italic text-ink-400 mt-2 text-sm leading-snug">
            &ldquo;{item.note}&rdquo;
          </p>
        )}

        {editing ? (
          <div className="mt-3 space-y-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={`text-2xl leading-none ${n <= rating ? "text-amber-600" : "text-paper-400"}`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="A short note…"
              className="paper-input"
              rows={2}
            />
            <div className="flex gap-2">
              <button onClick={saveReview} disabled={busy} className="btn-ink text-xs">
                Save
              </button>
              <button onClick={() => setEditing(false)} className="btn-ghost text-xs">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex gap-2 flex-wrap">
            {item.status === "want" && (
              <button onClick={() => setStatus("in_progress")} disabled={busy} className="btn-ghost text-xs">
                Start {ProgressFor(item.type).toLowerCase()}
              </button>
            )}
            {item.status !== "done" && (
              <button onClick={() => setEditing(true)} disabled={busy} className="btn-ink text-xs">
                Mark done
              </button>
            )}
            {item.status === "done" && (
              <button onClick={() => setEditing(true)} disabled={busy} className="btn-ghost text-xs">
                Edit review
              </button>
            )}
            <button onClick={remove} disabled={busy} className="btn-ghost text-xs">
              Remove
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
