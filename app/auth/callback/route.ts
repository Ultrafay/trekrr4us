import { NextRequest, NextResponse } from "next/server";

// Kept for compatibility — password auth doesn't use this,
// but if anyone hits it (e.g. old magic link), redirect home.
export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/`);
}
