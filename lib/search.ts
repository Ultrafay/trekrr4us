const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w342";

export type SearchResult = {
  external_id: string;
  type: "movie" | "series" | "book";
  title: string;
  year: string | null;
  cover_url: string | null;
  description: string | null;
  meta: Record<string, any>;
};

async function tmdbFetch(path: string) {
  const res = await fetch(`${TMDB_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_TOKEN}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json();
}

export async function searchMovies(q: string): Promise<SearchResult[]> {
  if (!q.trim()) return [];
  const data = await tmdbFetch(`/search/movie?query=${encodeURIComponent(q)}&include_adult=false`);
  return (data.results || []).slice(0, 8).map((r: any) => ({
    external_id: `tmdb-movie-${r.id}`,
    type: "movie" as const,
    title: r.title,
    year: r.release_date ? r.release_date.slice(0, 4) : null,
    cover_url: r.poster_path ? `${IMG_BASE}${r.poster_path}` : null,
    description: r.overview || null,
    meta: { tmdb_id: r.id, vote_average: r.vote_average },
  }));
}

export async function searchSeries(q: string): Promise<SearchResult[]> {
  if (!q.trim()) return [];
  const data = await tmdbFetch(`/search/tv?query=${encodeURIComponent(q)}&include_adult=false`);
  return (data.results || []).slice(0, 8).map((r: any) => ({
    external_id: `tmdb-tv-${r.id}`,
    type: "series" as const,
    title: r.name,
    year: r.first_air_date ? r.first_air_date.slice(0, 4) : null,
    cover_url: r.poster_path ? `${IMG_BASE}${r.poster_path}` : null,
    description: r.overview || null,
    meta: { tmdb_id: r.id, vote_average: r.vote_average },
  }));
}

export async function searchBooks(q: string): Promise<SearchResult[]> {
  if (!q.trim()) return [];
  const res = await fetch(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=8&fields=key,title,author_name,first_publish_year,cover_i`,
    { cache: "no-store" }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.docs || []).slice(0, 8).map((r: any) => ({
    external_id: `ol-${r.key}`,
    type: "book" as const,
    title: r.title,
    year: r.first_publish_year ? String(r.first_publish_year) : null,
    cover_url: r.cover_i ? `https://covers.openlibrary.org/b/id/${r.cover_i}-M.jpg` : null,
    description: r.author_name ? `by ${r.author_name.join(", ")}` : null,
    meta: { author: r.author_name, ol_key: r.key },
  }));
}

export async function searchAll(q: string): Promise<SearchResult[]> {
  const [movies, series, books] = await Promise.all([
    searchMovies(q).catch(() => []),
    searchSeries(q).catch(() => []),
    searchBooks(q).catch(() => []),
  ]);
  return [...movies.slice(0, 5), ...series.slice(0, 5), ...books.slice(0, 5)];
}
