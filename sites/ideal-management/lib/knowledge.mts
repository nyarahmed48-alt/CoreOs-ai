/**
 * The site crawler behind Ideal AI.
 *
 * Rather than hand-maintaining a copy of the site's content inside a prompt —
 * which goes stale the first time someone edits a page — the assistant reads
 * the live site and answers from what it finds. Edit the HTML, redeploy, and
 * Ideal AI knows the new wording without anyone touching this code.
 *
 * The crawl is deliberately small and bounded: same-origin pages only, a
 * handful of them, a few seconds, and a hard cap on how much text reaches the
 * model. A marketing site is a dozen pages, not a wiki.
 */

/** Pages held in memory between warm invocations. A cold start re-crawls. */
const CACHE_TTL_MS = 15 * 60 * 1000;

/** Bounds. Every one of these exists to keep a runaway crawl from eating the
 *  function's time budget or the model's context window. */
const MAX_PAGES = 8;
const MAX_DEPTH = 2;
const PAGE_TIMEOUT_MS = 4_000;
const CRAWL_BUDGET_MS = 7_000;
const MAX_CHARS_PER_PAGE = 6_000;
const MAX_TOTAL_CHARS = 14_000;

export interface CrawledPage {
  path: string;
  title: string;
  text: string;
}

export interface SiteKnowledge {
  pages: CrawledPage[];
  /** Where the content came from, for the health endpoint to report. */
  source: "crawl" | "cache" | "none";
  crawledAt: string | null;
}

/* Module-scope cache. Declarations only — nothing runs at import time. */
let cache: { at: number; pages: CrawledPage[] } | null = null;

/**
 * The facts we will not let a crawl failure take away. These are also given to
 * the model verbatim, above the crawled text, so a phone number can never be
 * garbled by HTML extraction going wrong.
 */
export const CONTACT_FACTS = `
Phone and WhatsApp: +964 772 252 1000
Email: imanagement19@gmail.com
Company: Ideal Management — recruitment, HR and business management.
`.trim();

const DECODE: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
  "&mdash;": "—",
  "&ndash;": "–",
  "&times;": "×",
  "&hellip;": "…",
};

/** HTML → readable text. Not a parser: a marketing page does not need one, and
 *  a regex that only ever deletes markup cannot produce broken markup. */
function toText(html: string): string {
  return html
    // Whole elements whose content is not prose.
    .replace(/<(script|style|noscript|svg|template)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    // Give block boundaries a space so words do not run together.
    .replace(/<\/(p|div|section|li|h[1-6]|tr|br|article|header|footer)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, (entity) => DECODE[entity.toLowerCase()] ?? " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*/g, "\n")
    .trim();
}

/**
 * The page's own content, without the header and footer that repeat on every
 * page. Left as the whole document when there is no <main> to narrow to.
 */
function bodyOf(html: string): string {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  return main ? main[1] : html;
}

function titleOf(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? toText(match[1]).slice(0, 120) : "";
}

/** Same-origin page links worth following. Skips assets, anchors, and the API. */
function linksIn(html: string, origin: string, from: string): string[] {
  const found = new Set<string>();

  for (const match of html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)) {
    const raw = match[1].trim();
    if (!raw || raw.startsWith("#") || /^(mailto:|tel:|javascript:|data:)/i.test(raw)) continue;

    let url: URL;
    try {
      url = new URL(raw, from);
    } catch {
      continue;
    }
    if (url.origin !== origin) continue;
    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/.netlify/")) continue;
    // Anything with an extension that is not .html is an asset, not a page.
    if (/\.[a-z0-9]+$/i.test(url.pathname) && !/\.html?$/i.test(url.pathname)) continue;

    url.hash = "";
    url.search = "";
    found.add(url.toString());
  }

  return [...found];
}

async function fetchPage(url: string): Promise<string | null> {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), PAGE_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: abort.signal,
      headers: { "user-agent": "IdealAI-SiteReader/1.0" },
    });
    if (!response.ok) return null;
    if (!/text\/html/i.test(response.headers.get("content-type") || "")) return null;
    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Breadth-first crawl of the site's own pages, starting at the homepage.
 * Returns whatever it managed to read — a partial crawl still beats none.
 */
async function crawl(origin: string): Promise<CrawledPage[]> {
  const deadline = Date.now() + CRAWL_BUDGET_MS;
  const seen = new Set<string>();
  const pages: CrawledPage[] = [];

  let frontier = [new URL("/", origin).toString()];
  seen.add(frontier[0]);

  for (let depth = 0; depth <= MAX_DEPTH && frontier.length && pages.length < MAX_PAGES; depth += 1) {
    if (Date.now() >= deadline) break;

    const batch = frontier.slice(0, MAX_PAGES - pages.length);
    // One level at a time, in parallel: eight small pages should not cost
    // eight round trips of latency.
    const fetched = await Promise.all(batch.map(async (url) => ({ url, html: await fetchPage(url) })));

    const next: string[] = [];
    for (const { url, html } of fetched) {
      if (!html) continue;

      const text = toText(bodyOf(html));
      if (text) {
        pages.push({
          path: new URL(url).pathname,
          title: titleOf(html),
          text: text.slice(0, MAX_CHARS_PER_PAGE),
        });
      }

      for (const link of linksIn(html, new URL(origin).origin, url)) {
        if (!seen.has(link)) {
          seen.add(link);
          next.push(link);
        }
      }
    }
    frontier = next;
  }

  return pages;
}

/** Crawled pages, from cache when they are fresh enough. Never throws. */
export async function getSiteKnowledge(origin: string | undefined): Promise<SiteKnowledge> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return { pages: cache.pages, source: "cache", crawledAt: new Date(cache.at).toISOString() };
  }
  if (!origin) return { pages: [], source: "none", crawledAt: null };

  try {
    const pages = await crawl(origin);
    if (!pages.length) return { pages: [], source: "none", crawledAt: null };
    cache = { at: Date.now(), pages };
    return { pages, source: "crawl", crawledAt: new Date(cache.at).toISOString() };
  } catch (error) {
    console.warn("Ideal AI: site crawl failed —", error);
    return { pages: [], source: "none", crawledAt: null };
  }
}

/** The crawled pages as one block of prompt text, within the total cap. */
export function knowledgeToPrompt(pages: CrawledPage[]): string {
  let budget = MAX_TOTAL_CHARS;
  const blocks: string[] = [];

  for (const page of pages) {
    if (budget <= 200) break;
    const block = `### Page: ${page.path}${page.title ? ` — ${page.title}` : ""}\n${page.text.slice(0, budget)}`;
    blocks.push(block);
    budget -= block.length;
  }

  return blocks.join("\n\n");
}
