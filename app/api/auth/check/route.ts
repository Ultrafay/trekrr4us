import { NextRequest, NextResponse } from "next/server";
import { isAllowed } from "@/lib/allowlist";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email || !isAllowed(email)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  return NextResponse.json({ ok: true });
}
