"use client";
import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/allowlist";

type Status = "want" | "in_progress" | "done";

export type Progress = {
  id: string;
  item_id: string;
  user_email: string;
  user_name: string;
  status: Status;
  rating: number | null;
  note: string | null;
  updated_at: string;
};

export type Item = {
  id: string;
  title: string;
  type: "movie" | "series" | "book";
  cover_url: string | null;
  year: string | null;
  external_id: string | null;
  added_by: string;
  added_by_name: string;
  created_at: string;
  item_progress: Progress[];
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
  return type === "book" ? "reading" : "watching";
}

function displayName(email: string, fallback: string, profiles: Profile[]): string {
  const p = profiles.find((x) => x.email === email);
  return p ? `${p.name} ${p.emoji}` : fallback;
}

function isMuunName(name: string): boolean {
  return name.toLowerCase().includes("muu");
}

function stampClass(email: string, profiles: Profile[]): string {
  const idx = profiles.findIndex((p) => p.email === email);
  return idx === 1 ? "muun" : "spidey";
}

export default function ItemCard({
  item,
  currentUserEmail,
  currentUserName,
  profiles,
}: {
  item: Item;
  currentUserEmail: string;
  currentUserName: string;
  profiles: Profile[];
}) {
  const router = useRouter();
  const [, start] = useTransition();

  const myProgressInit =
    item.item_progress.find((p) => p.user_email === currentUserEmail) ?? null;
  const otherProgress =
    item.item_progress.find((p) => p.user_email !== currentUserEmail) ?? null;

  const [myProgress, setMyProgress] = useState<Progress | null>(myProgressInit);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(myProgressInit?.rating ?? 0);
  const [note, setNote] = useState(myProgressInit?.note ?? "");
  const [hidden, setHidden] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (hidden) return null;

  async function addToMyList() {
    setErr(null);
    const optimistic: Progress = {
      id: "temp",
      item_id: item.id,
      user_email: currentUserEmail,
      user_name: currentUserName,
      status: "want",
      rating: null,
      note: null,
      updated_at: new Date().toISOString(),
    };
    setMyProgress(optimistic);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("item_progress")
      .insert({
        item_id: item.id,
        user_email: currentUserEmail,
        user_name: currentUserName,
        status: "want",
      })
      .select()
      .single();
    if (error) {
      setMyProgress(null);
      setErr(error.message);
    } else {
      setMyProgress(data);
      start(() => router.refresh());
    }
  }

  async function setStatus(status: Status) {
    if (!myProgress) return;
    setErr(null);
    const prev = myProgress.status;
    setMyProgress({ ...myProgress, status });
    const supabase = createClient();
    const { error } = await supabase
      .from("item_progress")
      .update({ status })
      .eq("id", myProgress.id);
    if (error) {
      setMyProgress({ ...myProgress, status: prev });
      setErr(error.message);
    } else {
      start(() => router.refresh());
    }
  }

  async function saveReview() {
    if (!myProgress) return;
    setErr(null);
    const prev = { ...myProgress };
    setMyProgress({ ...myProgress, status: "done", rating, note });
    setEditing(false);
    const supabase = createClient();
    const { error } = await supabase
      .from("item_progress")
      .update({ status: "done", rating, note })
      .eq("id", myProgress.id);
    if (error) {
      setMyProgress(prev);
      setEditing(true);
      setErr(error.message);
    } else {
      start(() => router.refresh());
    }
  }

  async function removeFromMyList() {
    if (!confirm("Remove from your list?")) return;
    setErr(null);
    if (myProgress && myProgress.id !== "temp") {
      const supabase = createClient();
      const { error } = await supabase
        .from("item_progress")
        .delete()
        .eq("id", myProgress.id);
      if (error) {
        setErr(error.message);
        return;
      }
      // If no one else has this item, clean up the shared item row too
      if (!otherProgress) {
        await supabase.from("items").delete().eq("id", item.id);
        setHidden(true);
      }
    }
    setMyProgress(null);
    start(() => router.refresh());
  }

  const addedByDisplay = displayName(item.added_by, item.added_by_name, profiles);
  const addedByStamp = stampClass(item.added_by, profiles);

  return (
    <div className="card-paper p-3 sm:p-4 flex gap-3 sm:gap-4">
      {/* Cover */}
      <div className="w-16 h-24 sm:w-20 sm:h-28 flex-shrink-0 bg-paper-200 rounded overflow-hidden">
        {item.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.cover_url}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-paper-500 text-[10px]">
            no cover
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title + stamp */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-lg sm:text-xl text-ink-800 leading-tight">
              {item.title}
              {item.year && (
                <span className="text-ink-200 text-xs sm:text-sm ml-2">({item.year})</span>
              )}
            </h3>
            <div className="text-xs text-ink-400 mt-0.5">{TYPE_LABEL[item.type]}</div>
          </div>
          <span className={`stamp ${addedByStamp} flex-shrink-0`}>{addedByDisplay}</span>
        </div>

        {/* Per-person progress */}
        <div className="mt-3 space-y-2.5">
          {/* Other user — read-only */}
          {otherProgress && (
            <div className="border-l-2 border-paper-300 pl-2.5">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span
                  className={`font-hand text-sm ${
                    isMuunName(otherProgress.user_name) ? "text-accent-moss" : "text-accent-rose"
                  }`}
                >
                  {displayName(otherProgress.user_email, otherProgress.user_name, profiles)}
                </span>
                <span className="text-ink-200 text-xs">·</span>
                <span className="text-ink-400 text-xs">{STATUS_LABEL[otherProgress.status]}</span>
                {otherProgress.rating ? (
                  <span className="text-amber-700 text-xs tracking-widest">
                    {"★".repeat(otherProgress.rating)}
                    <span className="text-paper-400">
                      {"★".repeat(5 - otherProgress.rating)}
                    </span>
                  </span>
                ) : null}
              </div>
              {otherProgress.note && (
                <p className="font-serif italic text-ink-400 text-xs mt-0.5 leading-snug">
                  &ldquo;{otherProgress.note}&rdquo;
                </p>
              )}
            </div>
          )}

          {/* Current user — interactive */}
          {myProgress ? (
            <div className="border-l-2 border-ink-100 pl-2.5">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span
                  className={`font-hand text-sm ${
                    isMuunName(currentUserName) ? "text-accent-moss" : "text-accent-rose"
                  }`}
                >
                  {displayName(currentUserEmail, currentUserName, profiles)}
                </span>
                <span className="text-ink-200 text-xs">·</span>
                <span className="text-ink-400 text-xs">{STATUS_LABEL[myProgress.status]}</span>
                {myProgress.rating ? (
                  <span className="text-amber-700 text-xs tracking-widest">
                    {"★".repeat(myProgress.rating)}
                    <span className="text-paper-400">
                      {"★".repeat(5 - myProgress.rating)}
                    </span>
                  </span>
                ) : null}
              </div>
              {myProgress.note && !editing && (
                <p className="font-serif italic text-ink-400 text-xs mt-0.5 leading-snug">
                  &ldquo;{myProgress.note}&rdquo;
                </p>
              )}

              {editing ? (
                <div className="mt-2 space-y-2">
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
                <div className="mt-2 flex gap-1.5 flex-wrap">
                  {myProgress.status === "want" && (
                    <button
                      onClick={() => setStatus("in_progress")}
                      className="btn-ghost text-xs"
                    >
                      Start {progressFor(item.type)}
                    </button>
                  )}
                  {myProgress.status !== "done" && (
                    <button onClick={() => setEditing(true)} className="btn-ink text-xs">
                      Mark done
                    </button>
                  )}
                  {myProgress.status === "done" && (
                    <button onClick={() => setEditing(true)} className="btn-ghost text-xs">
                      Edit review
                    </button>
                  )}
                  <button onClick={removeFromMyList} className="btn-ghost text-xs">
                    Remove
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={addToMyList} className="btn-ghost text-xs">
              + Add to my list
            </button>
          )}
        </div>

        {err && <p className="text-xs text-accent-rose mt-2">{err}</p>}
      </div>
    </div>
  );
}
