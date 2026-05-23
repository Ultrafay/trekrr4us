"use client";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }
  return (
    <button onClick={signOut} className="text-ink-200 hover:text-ink-600 text-xs">
      sign out
    </button>
  );
}
