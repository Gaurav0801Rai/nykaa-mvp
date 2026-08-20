# Nykaa Fashion — mobile mockup

Mobile-first React + Vite prototype. Runs on **http://localhost:3040**.

```bash
npm install
npm run dev
```

## Layout behaviour
- **< 900px** — the app renders full-bleed, as a normal mobile page.
- **≥ 900px** — the mobile viewport is centred inside a phone cutout on a dark
  stage, with a short caption beside it. Nothing about the app itself changes;
  the frame is a desktop-only affordance (`src/components/PhoneFrame.jsx`).

## Data
`src/data/products.json` — 2,106 products scraped from the live site, grouped
as `{ Women | Men | Kids | Home } → subcats[] → products[]`.

| Department | Subcategories | Products |
|---|---|---|
| Women | 9 | 540 |
| Men | 9 | 540 |
| Kids | 11 | 606 |
| Home | 7 | 420 |

Each product: `id, brand, name, image, price, salePrice, discount, badge`.
`src/data/catalog.js` flattens this into lookups (`getGender`, `getCategory`,
`getProduct`, `searchProducts`, `relatedProducts`) and stamps every product
with its `gender`, `category`, `categoryId` and `categorySlug` tags.

Kids → Personal Care legitimately has only 6 products upstream; every other
subcategory has the full 60.

## Routes
| Route | Screen |
|---|---|
| `/` | Home — hero, category rail, per-department grids, product rails |
| `/categories` | Department rail + category grid |
| `/c/:gender` | All products in a department |
| `/c/:gender/:category` | Category listing with chips + sorting |
| `/p/:id` | Product detail (full-bleed, chrome hidden) |
| `/search?q=` | Search across name / brand / category |
| `/wishlist` | Saved items — category circles, All items / Organised views |
| `/collections` | Saved items grouped by occasion |
| `/unavailable` | Out-of-stock and size-unavailable saves |
| `/bag` | Bag, price details, wishlist-sourced cross-sell strip |
| `/account` | Placeholder screen |

## Note on images
Product images hotlink to `adn-static1.nykaa.com` rather than being bundled.
They render today, but if the CDN adds hotlink protection or rotates paths the
images will break — download them locally if this mockup needs to outlive that.

## Wishlist discovery layer

Added on top of the original mockup. The design rule was to add, not redesign:
existing screens, components and theme are untouched, and no discount, coupon,
cashback or price-drop UI is introduced anywhere. Catalogue pricing that the
platform already shows (MRP, % off) is left exactly as it was.

### Confidence Score

A 0-100 score for **how well validated an item is by other buyers**. It is not
an authenticity, genuineness or trust score, and is never labelled as one.

Computed in `src/lib/confidence.js` from six review signals — volume, verified
purchase share, average rating, share of reviews with photos, recency and
rating consistency. The badge never renders without its one-line reason.

The catalogue carries no review data, so the underlying signals are synthesised
in `src/data/reviews.js` from a hash of the product id. They are deterministic:
the same product always scores the same, on every reload and every screen.

### Occasion inference

`src/lib/occasion.js` maps a product to Wedding / Office / Party / Everyday from
name, category and price band. Only high-confidence inferences are applied —
everything else stays in **Not tagged yet**, which is deliberate and is never
filled in by guessing. Tags are always correctable in one tap and the correction
wins over any later inference. The UI says "Looks like: Wedding", never
"Wedding", because it is an inference.

### Cross-sell strip

`src/lib/crosssell.js` sources the bag strip **only** from the wishlist. There
is no code path from the general catalogue into it.

| Mode | When | Heading |
|---|---|---|
| A | bag has pairable contents | "From your wishlist" + pairing rationale |
| B | bag empty, or nothing pairs | "Still in your wishlist" + Confidence reason |
| C | wishlist genuinely empty | strip is hidden |

Out-of-stock and size-unavailable saves are excluded from the strip, and items
already in the bag are filtered out.

## Groq configuration

All LLM work runs through server-side routes in `api/`. Three separate keys are
used so a rate limit on one feature cannot starve another; a limited key is
never swapped for another task's key.

| Env var | Route | Task |
|---|---|---|
| `GROQ_API_KEY_CONFIDENCE` | `/api/confidence-reason` | Write the Confidence Score reason line |
| `GROQ_API_KEY_OCCASION` | `/api/occasion` | Infer likely occasion + confidence |
| `GROQ_API_KEY_CROSSSELL` | `/api/crosssell` | Pick complementary saved items + rationale |

**Keys are read server-side only and never reach the browser.** They are not
`VITE_` prefixed, so they cannot be inlined into the client bundle.

Every route has a deterministic fallback and returns an empty result rather
than an error, so **the whole app works end to end with no keys set**:

- Confidence reason → rule-based sentence built from the raw review numbers
- Occasion → "Not tagged yet"
- Cross-sell → Mode B ranking (Confidence Score + how long it has been saved)

Model output is parsed defensively — malformed rows are dropped, and any
product id the model returns that is not in the supplied candidate list is
discarded on both the server and the client. Reasons and occasion tags are
computed once per product and cached on the wishlist entry; only cross-sell
recomputes, and only when the bag changes, debounced with the previous result
left on screen so the strip never flickers.

### Running with the routes

```bash
cp .env.example .env.local   # then fill in the three keys
npx vercel dev
```

`npm run dev` runs the Vite server alone — the `/api` routes are not served, so
the app runs on its deterministic paths. That is a supported mode, not a broken
one.

State lives in `src/state/store.jsx` and persists to `sessionStorage`, so the
wishlist, bag, occasion tags and notify-me flags survive navigation within a
session.
