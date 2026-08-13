# Photographs for the demo sites

The demos ship with gradient placeholders. This is how you replace them with
real pictures. Two steps: drop the files in here, then name them in
`src/site/demos/content.ts`.

You can do one at a time. Anything you have not filled in stays a gradient, so
the pages never look half-finished while you work through them.

## 1. Put the files here

```
public/demos/barber/shopfront.jpg
public/demos/nails/hero.jpg
public/demos/nails/work-1.jpg   … up to work-6.jpg
public/demos/restaurant/room.jpg
public/demos/restaurant/events.jpg
public/demos/restaurant/dish-1.jpg   … up to dish-6.jpg
```

The names are only a suggestion — whatever you use here has to match step 2.

**Sizes.** Longest edge about **1600px**, JPEG, aim for **under 300KB each**.
Bigger than that and a visitor on phone data waits, which costs you more than
the extra sharpness gains you. `squoosh.app` does this in a browser, free.

**Shapes.** They are cropped to fill, so the subject wants to be near the
middle:

| Slot | Shape |
|---|---|
| Barber hero, nails hero, restaurant story | tall, 4:5 |
| Gallery tiles | square, 1:1 |
| Restaurant events | landscape, 4:3 |

## 2. Name them in `content.ts`

Open `src/site/demos/content.ts` and find the photo block at the bottom of the
business you are filling in. Replace the empty value:

```ts
// before
heroPhoto: undefined as Photo | undefined,

// after
heroPhoto: {
  src: "/demos/barber/shopfront.jpg",
  alt: {
    ar: "واجهة المحل من الشارع مساءً",
    ckb: "بەردەمی دوکانەکە لە شەقامەوە لە ئێوارەدا",
    en: "The shopfront from the street in the evening",
  },
},
```

Galleries are a list, filled in order:

```ts
gallery: [
  { src: "/demos/nails/work-1.jpg", alt: { ar: "…", ckb: "…", en: "…" } },
  { src: "/demos/nails/work-2.jpg", alt: { ar: "…", ckb: "…", en: "…" } },
],
```

Two entries fills the first two tiles; the other four stay gradient.

`src` always starts with `/demos/` — that is the URL, not the folder path on
your computer.

### Alt text

Required, in all three languages, and it is not busywork. It is read aloud to a
blind visitor, shown when a photo fails to load, and read by Google. Describe
what is actually in the frame — "the shopfront at dusk", not "image1".

## Which photos are worth taking first

Not all slots pay off equally:

1. **Nail studio gallery.** A salon is judged on its work. Six good close-ups
   of finished nails do more for that page than anything else on it.
2. **Restaurant food.** Dishes, shot from above in daylight, close.
3. **The heroes.** One strong establishing shot each.
4. **Restaurant events room.** Lowest priority.

## Where the photos should come from

Best is **your own work** — real jobs, real shops, with the owner's permission.
It is honest, and a prospect can tell.

If you use stock, use a site that grants a licence for commercial use
(Unsplash, Pexels) and keep a note of where each file came from. **Do not pull
images out of Google Image results.** Most are somebody's copyrighted work, and
a client-facing site is exactly where that gets noticed.

A gradient placeholder is better than a photo you are not allowed to use.
