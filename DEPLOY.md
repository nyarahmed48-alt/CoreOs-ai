# Deploying CoreOs

The site runs on **Cloudflare Workers**. Netlify still works and is left in
place until the switch is finished, so nothing goes dark mid-move.

---

## Changing the model or the API key

**You do not need a developer for this, and you do not need a deploy.**

Go to **`https://<your-site>/admin`**, paste the admin token, and change either
field. It takes effect on the very next request.

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

Cloudflare dashboard → **Workers & Pages** → **coreos-ai** → **Settings** →
**Builds** → connect this GitHub repository.

| Setting | Value |
|---|---|
| Branch | `main` |
| Build command | *(leave empty)* |
| Deploy command | `npm run deploy` |

`npm run deploy` builds the site and then deploys it, in that order. Putting
both in one command means a deploy can never run against a missing or stale
`dist/`, which is the usual reason a first Cloudflare build fails with
*"the directory specified by the assets.directory field does not exist"*.

Every push to `main` then deploys on its own. `wrangler.toml` already carries
the rest of the configuration.

### 2. Set the variables

**Settings → Variables and Secrets.**

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

Without this, `/admin` can read settings but not save them, and the model stays
whatever the environment variable says.

```
npx wrangler kv namespace create LAB_CONFIG
```

That prints an id. Uncomment the last block of `wrangler.toml`, paste the id in,
commit, push. The site works fine without this — it just falls back to
environment variables and says so.

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
| `kind: "timeout"` | The model is too slow — put a faster one first |

Safe to leave public. It returns states and status codes only: never the key,
never the model ids, never the provider's own error text.

---

## Finishing the move off Netlify

Do this only once the Worker is serving a real deployment and
`/api/lab/health` returns `"ok": true` on the Cloudflare URL.

1. Point the domain at the Worker (**Workers & Pages → coreos-ai → Settings →
   Domains and Routes**).
2. Update the host in `index.html` (canonical, `og:url`, `og:image`,
   hreflang), `public/robots.txt`, and `public/sitemap.xml`. They all still say
   `coreosai.netlify.app`.
3. Resubmit the sitemap in Google Search Console.
4. Only then delete `netlify.toml`, `netlify/`, and the Netlify function rules
   in `public/_redirects`.

Leaving step 4 until last means a bad deploy can be undone by pointing DNS
back.

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
