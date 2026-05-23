import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { getProfile } from "@/lib/allowlist";
import SignOutButton from "./SignOutButton";

export default async function Nav() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = getProfile(user?.email);

  return (
    <>
      {/* Top bar */}
      <header className="border-b border-paper-300 bg-paper-100/70 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="flex flex-col items-start min-w-0">
            <span className="ornament text-[11px]">✦ &nbsp;❖&nbsp; ✦</span>
            <span className="font-serif text-xl sm:text-2xl text-ink-800 leading-none truncate">
              Our Library
            </span>
          </Link>
          {profile && (
            <div className="flex items-center gap-3 text-sm flex-shrink-0">
              <span className="font-hand text-base sm:text-lg text-accent-rose">
                {profile.name} {profile.emoji}
              </span>
              <SignOutButton />
            </div>
          )}
        </div>

        {/* Desktop nav links */}
        {profile && (
          <nav className="hidden sm:block max-w-3xl mx-auto px-5 pb-2">
            <div className="flex gap-1 text-sm">
              <NavLink href="/" label="Home" />
              <NavLink href="/library" label="Library" />
              <NavLink href="/search" label="Add" />
              <NavLink href="/suggest" label="Between us" />
              <NavLink href="/me" label="Me" />
            </div>
          </nav>
        )}
      </header>

      {/* Bottom nav (mobile only) */}
      {profile && (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-paper-100/95 backdrop-blur-sm border-t border-paper-300">
          <div className="flex justify-around items-stretch">
            <BottomLink href="/" icon="⌂" label="Home" />
            <BottomLink href="/library" icon="❖" label="Library" />
            <BottomLink href="/search" icon="+" label="Add" />
            <BottomLink href="/suggest" icon="✦" label="Us" />
            <BottomLink href="/me" icon="◐" label="Me" />
          </div>
        </nav>
      )}
    </>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 text-ink-400 hover:text-ink-800 hover:bg-paper-200 rounded transition-colors"
    >
      {label}
    </Link>
  );
}

function BottomLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex-1 flex flex-col items-center justify-center py-2 text-ink-400 hover:text-ink-800"
    >
      <span className="text-lg leading-none mb-0.5">{icon}</span>
      <span className="text-[10px] uppercase tracking-wider">{label}</span>
    </Link>
  );
}
