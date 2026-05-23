import { NextRequest, NextResponse } from "next/server";
import { searchAll, searchMovies, searchSeries, searchBooks } from "@/lib/search";
import { createClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  // Require auth
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q") || "";
  const type = req.nextUrl.searchParams.get("type") || "all";

  let results: any[] = [];
  try {
    if (type === "movie") results = await searchMovies(q);
    else if (type === "series") results = await searchSeries(q);
    else if (type === "book") results = await searchBooks(q);
    else results = await searchAll(q);
  } catch (e) {
    return NextResponse.json({ results: [], error: String(e) }, { status: 500 });
  }
  return NextResponse.json({ results });
}
