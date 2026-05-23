import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { isAllowed } from "@/lib/allowlist";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user?.email && isAllowed(data.user.email)) {
      return NextResponse.redirect(`${origin}/`);
    }
    // Not allowed → sign them back out
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(`${origin}/login?error=denied`);
}
