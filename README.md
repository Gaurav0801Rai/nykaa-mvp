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
| `/wishlist`, `/account` | Placeholder screens |

## Note on images
Product images hotlink to `adn-static1.nykaa.com` rather than being bundled.
They render today, but if the CDN adds hotlink protection or rotates paths the
images will break — download them locally if this mockup needs to outlive that.
