// Allowlist is in env vars, not hardcoded.
// ALLOWED_EMAILS env var format: "email1@x.com:Spideyyy:🕷️,email2@y.com:Muuunn:🌙"
export type Profile = { email: string; name: string; emoji: string };

export function getAllowlist(): Profile[] {
  const raw = process.env.ALLOWED_EMAILS || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const [email, name, emoji] = entry.split(":");
      return { email: email.toLowerCase(), name: name || email, emoji: emoji || "" };
    });
}

export function isAllowed(email: string): boolean {
  return getAllowlist().some((p) => p.email === email.toLowerCase());
}

export function getProfile(email: string | undefined | null): Profile | null {
  if (!email) return null;
  return getAllowlist().find((p) => p.email === email.toLowerCase()) || null;
}
