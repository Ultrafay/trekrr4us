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

function progressFor(type: Item["type"]): string {
  return type === "book" ? "Reading" : "Watching";
}

export default function ItemCard({ item }: { item: Item }) {
  const router = useRouter();
  const [, start] = useTransition();
  // Local optimistic state
  const [localItem, setLocalItem] = useState(item);
  const [hidden, setHidden] = useState(false);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(item.rating || 0);
  const [note, setNote] = useState(item.note || "");
  const [err, setErr] = useState<string | null>(null);

  if (hidden) return null;

  async function setStatus(status: Status) {
    setErr(null);
    const prev = localItem.status;
    setLocalItem({ ...localItem, status });
    const supabase = createClient();
    const { error } = await supabase
      .from("items")
      .update({ status })
      .eq("id", localItem.id);
    if (error) {
      setLocalItem({ ...localItem, status: prev });
      setErr(error.message);
    } else {
      start(() => router.refresh());
    }
  }

  async function saveReview() {
    setErr(null);
    const prev = { ...localItem };
    setLocalItem({ ...localItem, status: "done", rating, note });
    setEditing(false);
    const supabase = createClient();
    const { error } = await supabase
      .from("items")
      .update({ status: "done", rating, note })
      .eq("id", localItem.id);
    if (error) {
      setLocalItem(prev);
      setErr(error.message);
    } else {
      start(() => router.refresh());
    }
  }

  async function remove() {
    if (!confirm("Remove this from the library?")) return;
    setErr(null);
    setHidden(true);
    const supabase = createClient();
    const { error } = await supabase.from("items").delete().eq("id", localItem.id);
    if (error) {
      setHidden(false);
      setErr(error.message);
    } else {
      start(() => router.refresh());
    }
  }

  const isMuun = localItem.added_by_name?.toLowerCase().includes("muu");

  return (
    <div className="card-paper p-3 sm:p-4 flex gap-3 sm:gap-4">
      <div className="w-16 h-24 sm:w-20 sm:h-28 flex-shrink-0 bg-paper-200 rounded overflow-hidden">
        {localItem.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={localItem.cover_url}
            alt={localItem.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-paper-500 text-[10px]">
            no cover
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-lg sm:text-xl text-ink-800 leading-tight">
              {localItem.title}
              {localItem.year && (
                <span className="text-ink-200 text-xs sm:text-sm ml-2">
                  ({localItem.year})
                </span>
              )}
            </h3>
            <div className="text-xs text-ink-400 mt-0.5">
              {TYPE_LABEL[localItem.type]} · {STATUS_LABEL[localItem.status]}
            </div>
          </div>
          <span className={`stamp ${isMuun ? "muun" : "spidey"} flex-shrink-0`}>
            {localItem.added_by_name}
          </span>
        </div>

        {localItem.rating ? (
          <div className="text-amber-700 text-sm mt-1.5 tracking-widest">
            {"★".repeat(localItem.rating)}
            <span className="text-paper-400">
              {"★".repeat(5 - localItem.rating)}
            </span>
          </div>
        ) : null}

        {localItem.note && (
          <p className="font-serif italic text-ink-400 mt-2 text-sm leading-snug">
            &ldquo;{localItem.note}&rdquo;
          </p>
        )}

        {editing ? (
          <div className="mt-3 space-y-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={`text-2xl leading-none ${
                    n <= rating ? "text-amber-600" : "text-paper-400"
                  }`}
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
              <button onClick={saveReview} className="btn-ink text-xs">
                Save
              </button>
              <button onClick={() => setEditing(false)} className="btn-ghost text-xs">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex gap-1.5 flex-wrap">
            {localItem.status === "want" && (
              <button onClick={() => setStatus("in_progress")} className="btn-ghost text-xs">
                Start {progressFor(localItem.type).toLowerCase()}
              </button>
            )}
            {localItem.status !== "done" && (
              <button onClick={() => setEditing(true)} className="btn-ink text-xs">
                Mark done
              </button>
            )}
            {localItem.status === "done" && (
              <button onClick={() => setEditing(true)} className="btn-ghost text-xs">
                Edit review
              </button>
            )}
            <button onClick={remove} className="btn-ghost text-xs">
              Remove
            </button>
          </div>
        )}

        {err && <p className="text-xs text-accent-rose mt-2">{err}</p>}
      </div>
    </div>
  );
}
