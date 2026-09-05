# Deploying CoreOs

The site runs on **Netlify**, and its agents run on **OpenRouter**. Those are
the two moving parts; everything below is one of them.

A Cloudflare Worker (`worker/`, `wrangler.toml`) is still in the repo and still
works. It serves exactly the same endpoints from the same shared code, so it
remains a working alternative rather than a half-finished migration — but
Netlify is the host this document describes.

---

## Changing the model or the API key

**You do not need a developer for this, and you do not need a deploy.**

Go to **`https://<your-site>/admin`**, paste the admin token, and change either
field. It takes effect on the very next request.

This works on both hosts, from the same code. The only setup is one
environment variable:

| Name | Type | Value |
|---|---|---|
| `ADMIN_TOKEN` | Secret | any long random string — this is the password |

Netlify: **Site configuration → Environment variables**. Cloudflare:
**Settings → Variables and Secrets**. Generate one with
`openssl rand -base64 32`.

Storage needs no setup on Netlify — it uses Netlify Blobs, which is already
there on any deployed site. On Cloudflare it needs a KV namespace. Without a
store, `/admin` can still read the current settings but not save them, and says
so rather than reporting a change it did not make.

- **Model** — one id from [openrouter.ai/models](https://openrouter.ai/models),
  or several separated by commas. They are tried in order, so the second one
  covers you when the first is out of quota or retired.
- **API key** — leave blank to keep the current one. Only send a new one when
  you actually mean to replace it.

The page never shows you the stored key, only its last four characters. That is
deliberate: it is enough to tell which key is loaded, and useless to anyone who
gets hold of the screen.

If `/admin` says settings cannot be saved, one of the two setup steps below is
missing.

---

## First-time setup

### 1. Connect the repo

Netlify dashboard → **Add new site** → **Import an existing project** → this
GitHub repository. `netlify.toml` already carries the build command, the publish
directory and the routing, so the defaults it offers are the right ones.

| Setting | Value |
|---|---|
| Branch | `main` |
| Build command | `npm run build:web` |
| Publish directory | `dist` |
| Functions directory | `netlify/functions` |

Every push to `main` then deploys on its own.

> **On Cloudflare instead:** Workers & Pages → **coreos-ai** → Settings →
> Builds, deploy command `npm run deploy`. That one command builds and then
> deploys, in that order, so a deploy can never run against a missing `dist/` —
> the usual reason a first Cloudflare build fails with *"the directory specified
> by the assets.directory field does not exist"*.

### 2. Set the variables

Netlify: **Site configuration → Environment variables**. Cloudflare:
**Settings → Variables and Secrets**.

| Name | Type | What it is |
|---|---|---|
| `OPENROUTER_API_KEY` | Secret | From [openrouter.ai/keys](https://openrouter.ai/keys) |
| `OPENROUTER_MODEL` | Text | One id, or several comma-separated |
| `ADMIN_TOKEN` | Secret | Whatever long random string you like — this is the `/admin` password |

**`ADMIN_TOKEN` is what protects `/admin`.** Leave it unset and the page
refuses every change, which is the safe failure. Make it long and random; a
short one is guessable and whoever guesses it can point your sandbox at their
own model. Generate one with:

```
openssl rand -base64 32
```

### 3. Create the settings store

**On Netlify there is nothing to do.** Netlify Blobs is available to every
deployed function, and `/admin` uses it as soon as the site is live.

On Cloudflare it is a KV namespace:

```
npx wrangler kv namespace create LAB_CONFIG
```

That prints an id. Uncomment the last block of `wrangler.toml`, paste the id in,
commit, push. The site works fine without a store on either host — it falls back
to environment variables and says so.

---

## The drop-in AI endpoint

`netlify/functions/ai.ts` is a second, self-contained way to run the assistant,
built so the AI can be changed without a developer and without touching code.
It registers its own routes, so it needs nothing in `netlify.toml` or
`public/_redirects` — the file is the whole install.

**Site configuration → Environment variables:**

| Name | |
|---|---|
| `AI_API_KEY` | The key from whichever provider you use |
| `AI_MODEL` | One model id, or several comma-separated |
| `AI_PROVIDER` | `openrouter` (default), `openai`, `anthropic`, `groq`, `deepseek`, `mistral`, `together`, `xai`, `gemini`, or `custom` with `AI_BASE_URL` |

Save, then **Deploys → Trigger deploy**. Netlify only hands new variables to a
new build, so a saved change does nothing until the site is rebuilt.

Then open **`/ai`**: it says whether the assistant is working, which provider is
in force, which position in `AI_MODEL` answered, and what to change if it is
not. It has a box to send it a test message. No token, no secrets shown — it
reports states and counts only.

`AI_MODEL` takes a list for the same reason `OPENROUTER_MODEL` does: free models
carry a daily cap, and a second id is what keeps the site answering when the
first hits it.

---

## Checking it works

`https://<your-site>/api/lab/health` makes one real call and reports what
happened:

| It says | What is wrong |
|---|---|
| `"ok": true` | Nothing |
| `kind: "quota"` | Out of credit or over the free daily cap |
| `kind: "auth"` | Key missing, revoked, or not allowed for that model |
| `kind: "model"` | A model id is unknown or retired |
| `kind: "timeout"` | Every model in the list was too slow — put a faster one first |

It also reports `answeredBy`: which position in `OPENROUTER_MODEL` actually
answered. Anything above 1 means the site is running on a fallback and the ids
before it need looking at — from outside, that is indistinguishable from a
healthy site right up until the last one runs out too.

Safe to leave public. It returns states and status codes only: never the key,
never the model ids, never the provider's own error text.

---

## If you move hosts later

The canonical URLs in `index.html` (canonical, `og:url`, `og:image`, hreflang),
`public/robots.txt` and `public/sitemap.xml` all say `coreosai.netlify.app`. On
Netlify that is correct and there is nothing to do.

If the domain ever moves, change those three files and resubmit the sitemap in
Google Search Console — and change them *after* the new host is serving and its
`/api/lab/health` returns `"ok": true`, not before. Pointing the canonical tag
at a host that is not answering yet is how a working site gets deindexed.

---

## Local development

```
npm run dev
```

Express, on port 3000, reading `.env`. Same agent code as the Worker — only
the transport differs.

To exercise the Worker itself, including `/admin`:

```
npm run build:web && npx wrangler dev
```
