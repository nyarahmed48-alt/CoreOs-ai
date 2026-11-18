/**
 * NASA Image and Video Library integration (optional, non-critical).
 *
 * Endpoint:    https://images-api.nasa.gov/search?q=<query>&media_type=image
 * Credentials: none required (this API does not use api.nasa.gov keys).
 * Updates:     the library is curated continuously; results are cached locally for 24 h.
 * Usage:       NASA media are generally not subject to copyright in the US, but NASA's
 *              media guidelines require that NASA imagery not be used to imply endorsement.
 *              Each image is credited with its NASA center and id.
 *
 * The simulation never depends on this. Failures (offline, timeout, rate limit,
 * malformed JSON) return a typed error that the UI shows as a demonstration-mode notice.
 */
export interface NasaImage {
  nasaId: string;
  title: string;
  description: string;
  dateCreated: string;
  center: string;
  thumbUrl: string;
  detailUrl: string;
}

export interface ImageResult {
  ok: boolean;
  images: NasaImage[];
  fromCache?: boolean;
  error?: "offline" | "timeout" | "rate-limited" | "http" | "invalid";
  message?: string;
}

const fail = (error: NonNullable<ImageResult["error"]>, message: string): ImageResult => ({ ok: false, images: [], error, message });

const ENDPOINT = "https://images-api.nasa.gov/search";
const CACHE_KEY = "lunar-command:nasa-images";
const CACHE_TTL_MS = 24 * 3600 * 1000;

export function parseSearchResponse(json: unknown, limit = 9): NasaImage[] | null {
  const items = (json as { collection?: { items?: unknown } })?.collection?.items;
  if (!Array.isArray(items)) return null;
  const out: NasaImage[] = [];
  for (const it of items) {
    const data = (it as { data?: unknown[] }).data?.[0] as Record<string, unknown> | undefined;
    const links = (it as { links?: { href?: unknown; rel?: unknown; render?: unknown }[] }).links;
    const thumb = links?.find((l) => typeof l.href === "string" && (l.rel === "preview" || l.render === "image"))?.href;
    if (!data || typeof data.nasa_id !== "string" || typeof thumb !== "string") continue;
    if (!thumb.startsWith("https://")) continue;
    out.push({
      nasaId: data.nasa_id,
      title: typeof data.title === "string" ? data.title : "Untitled",
      description: typeof data.description === "string" ? data.description.replace(/<[^>]+>/g, "").slice(0, 400) : "",
      dateCreated: typeof data.date_created === "string" ? data.date_created.slice(0, 10) : "",
      center: typeof data.center === "string" ? data.center : "NASA",
      thumbUrl: thumb,
      detailUrl: `https://images.nasa.gov/details/${encodeURIComponent(data.nasa_id)}`,
    });
    if (out.length >= limit) break;
  }
  return out;
}

function readCache(query: string): NasaImage[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as { query: string; at: number; images: NasaImage[] };
    if (c.query !== query || Date.now() - c.at > CACHE_TTL_MS || !Array.isArray(c.images)) return null;
    return c.images;
  } catch {
    return null;
  }
}

function writeCache(query: string, images: NasaImage[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ query, at: Date.now(), images }));
  } catch {
    /* ignore */
  }
}

export async function searchNasaImages(
  query: string,
  opts: { timeoutMs?: number; fetchImpl?: typeof fetch; useCache?: boolean } = {},
): Promise<ImageResult> {
  const { timeoutMs = 8000, fetchImpl = fetch, useCache = true } = opts;
  if (useCache) {
    const cached = readCache(query);
    if (cached) return { ok: true, images: cached, fromCache: true };
  }
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return fail("offline", "You appear to be offline.");
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(`${ENDPOINT}?q=${encodeURIComponent(query)}&media_type=image`, { signal: ctrl.signal });
    if (res.status === 429) return fail("rate-limited", "NASA's image service is rate-limiting requests. Try again later.");
    if (!res.ok) return fail("http", `NASA's image service returned HTTP ${res.status}.`);
    let json: unknown;
    try {
      json = await res.json();
    } catch {
      return fail("invalid", "The response was not valid JSON.");
    }
    const images = parseSearchResponse(json);
    if (!images) return fail("invalid", "The response did not have the expected format.");
    if (useCache) writeCache(query, images);
    return { ok: true, images, fromCache: false };
  } catch (e) {
    if ((e as { name?: string })?.name === "AbortError") return fail("timeout", `No response within ${timeoutMs / 1000} s.`);
    return fail("offline", "The request could not be completed (network unavailable or blocked).");
  } finally {
    clearTimeout(timer);
  }
}
