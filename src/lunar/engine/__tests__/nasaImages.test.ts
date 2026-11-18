import { describe, expect, it } from "vitest";
import { parseSearchResponse, searchNasaImages } from "../../science/nasaImages";

const sample = {
  collection: {
    items: [
      {
        data: [{ nasa_id: "PIA1", title: "South pole mosaic", description: "<p>Mosaic</p>", date_created: "2012-03-20T00:00:00Z", center: "GSFC" }],
        links: [{ href: "https://images-assets.nasa.gov/image/PIA1/PIA1~thumb.jpg", rel: "preview", render: "image" }],
      },
      { data: [{ title: "no id" }], links: [] },
      { data: [{ nasa_id: "X", title: "insecure" }], links: [{ href: "http://example.com/x.jpg", rel: "preview" }] },
    ],
  },
};

const jsonResponse = (body: unknown, status = 200) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as unknown as Response;

describe("NASA image library client", () => {
  it("parses valid items and skips malformed or insecure ones", () => {
    const out = parseSearchResponse(sample)!;
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ nasaId: "PIA1", center: "GSFC", description: "Mosaic", dateCreated: "2012-03-20" });
  });

  it("rejects responses with the wrong shape", () => {
    expect(parseSearchResponse({ nope: 1 })).toBeNull();
  });

  it("handles rate limits, HTTP errors, invalid JSON and network failure", async () => {
    const opts = { useCache: false } as const;
    expect(await searchNasaImages("moon", { ...opts, fetchImpl: async () => jsonResponse({}, 429) })).toMatchObject({ ok: false, error: "rate-limited" });
    expect(await searchNasaImages("moon", { ...opts, fetchImpl: async () => jsonResponse({}, 500) })).toMatchObject({ ok: false, error: "http" });
    expect(await searchNasaImages("moon", { ...opts, fetchImpl: async () => jsonResponse({ bad: true }) })).toMatchObject({ ok: false, error: "invalid" });
    expect(
      await searchNasaImages("moon", {
        ...opts,
        fetchImpl: async () => {
          throw new TypeError("Failed to fetch");
        },
      }),
    ).toMatchObject({ ok: false, error: "offline" });
  });

  it("times out slow responses", async () => {
    const slow: typeof fetch = (_u, init) =>
      new Promise<Response>((_, reject) => init?.signal?.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" }))));
    expect(await searchNasaImages("moon", { useCache: false, timeoutMs: 20, fetchImpl: slow })).toMatchObject({ ok: false, error: "timeout" });
  });

  it("returns images on success", async () => {
    const r = await searchNasaImages("moon", { useCache: false, fetchImpl: async () => jsonResponse(sample) });
    expect(r.ok).toBe(true);
  });
});
