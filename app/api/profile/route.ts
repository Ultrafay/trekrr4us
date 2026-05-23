import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/allowlist";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  const profile = getProfile(email);
  if (!profile) return NextResponse.json({ name: "Unknown", emoji: "" });
  return NextResponse.json(profile);
}
