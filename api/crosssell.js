import { groqJSON, asString, asArray, readJsonBody, methodGuard } from './_groq.js'

// Picks which SAVED items complement what is in the bag, with a one-line
// rationale each.
//
// The candidate list is supplied by the client and is already filtered to
// in-stock wishlist items that are not in the bag. Any id the model returns
// that is not in that list is dropped here, and the client checks again — the
// strip can never show a general-catalogue product.

const SYSTEM = `You pick which items from a shopper's saved list go well with what is in their bag.

You will get BAG items and CANDIDATE items. Choose only from CANDIDATES.

Pair on how the items are worn together, for example:
- black jeans -> white t-shirt, sneakers, belt
- ethnic kurta -> juttis, jewellery, clutch
- trekking trousers -> trekking shoes, sunglasses
- watch -> belt, formal shoes

For each pick write a short rationale naming the bag item it goes with, then
the item's rating and buyer count, e.g. "Pairs well with black denim — 4.5 stars from 210 buyers".

Rules:
- Only return candidate ids that were given to you. Never invent an id.
- Never mention price, discounts, offers, coupons or savings.
- Skip anything that does not genuinely pair; returning fewer is fine.
- Order best pairing first, at most 10.

Return JSON: {"picks":[{"id":"<candidate id>","rationale":"<line>"}]}`

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return

  const body = readJsonBody(req)
  const bag = asArray(body?.bag).slice(0, 12)
  const candidates = asArray(body?.candidates).slice(0, 40)

  if (!candidates.length) return res.status(200).json({ picks: [] })
  // an empty bag has nothing to pair against — the client ranks by itself
  if (!bag.length) return res.status(200).json({ picks: [] })

  const allowed = new Set(candidates.map((c) => String(c?.id)))

  const user = JSON.stringify({
    bag: bag.map((p) => ({
      name: asString(p?.name, 90),
      category: asString(p?.category, 40),
    })),
    candidates: candidates.map((p) => ({
      id: String(p?.id),
      name: asString(p?.name, 90),
      category: asString(p?.category, 40),
      rating: Number(p?.avgRating) || null,
      buyers: Number(p?.verifiedBuyerCount) || null,
    })),
  })

  const parsed = await groqJSON('crosssell', { system: SYSTEM, user, maxTokens: 1100 })

  const picks = []
  const seen = new Set()
  for (const row of asArray(parsed?.picks)) {
    const id = asString(row?.id, 40)
    const rationale = asString(row?.rationale, 160)
    if (!id || !allowed.has(id) || seen.has(id)) continue
    seen.add(id)
    picks.push({ id, rationale: rationale || null })
    if (picks.length >= 10) break
  }

  // no-store: this depends on the current bag, so it must not be edge-cached
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json({ picks })
}
