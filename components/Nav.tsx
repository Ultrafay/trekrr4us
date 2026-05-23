import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { getProfile } from "@/lib/allowlist";
import SignOutButton from "./SignOutButton";

export default async function Nav() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = getProfile(user?.email);

  return (
    <header className="border-b border-paper-300 bg-paper-100/60 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
        <Link href="/" className="flex flex-col items-start">
          <span className="ornament">✦ &nbsp;❖&nbsp; ✦</span>
          <span className="font-serif text-2xl text-ink-800 leading-none">Our Library</span>
        </Link>
        {profile && (
          <div className="flex items-center gap-3 text-sm">
            <Link href="/library" className="text-ink-600 hover:text-ink-800">Library</Link>
            <Link href="/search" className="text-ink-600 hover:text-ink-800">Add</Link>
            <Link href="/suggest" className="text-ink-600 hover:text-ink-800">Suggest</Link>
            <Link href="/me" className="text-ink-600 hover:text-ink-800">Me</Link>
            <span className="font-hand text-base text-accent-rose">
              {profile.name} {profile.emoji}
            </span>
            <SignOutButton />
          </div>
        )}
      </div>
    </header>
  );
}
