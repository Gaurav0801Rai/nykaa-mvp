import { groqJSON, asString, asArray, readJsonBody, methodGuard } from './_groq.js'

// Turns raw review numbers into the one-line reason that sits under the
// Confidence Score. The score itself is computed on the client from review
// data — the model only writes the sentence explaining it.
//
// On any failure this returns an empty map and the client keeps its
// rule-based sentence.

const SYSTEM = `You write one-line explanations for a shopping app's Confidence Score.

The Confidence Score measures how well validated an item is by other buyers.
It is NEVER an authenticity, genuineness or trust score — never use those words.

For each product you get review data. Write ONE short sentence, under 95
characters, saying why the item is worth buying, in plain language a shopper
would use. Examples of the register:
"Buyers keep posting photos, so you can see the real thing first."
"Ratings barely vary - what arrives is what people expect."

Rules:
- Do NOT quote the raw numbers. They are displayed on their own line already.
- Base the sentence on whichever signal is genuinely strongest for that product.
- Never mention price, discounts, offers, coupons or savings.
- No urgency ("selling fast", "hurry").
- Return JSON: {"reasons":[{"id":"<product id>","reason":"<line>"}]}`

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return

  const body = readJsonBody(req)
  const products = asArray(body?.products).slice(0, 24)
  if (!products.length) return res.status(400).json({ error: 'No products supplied' })

  const known = new Set(products.map((p) => String(p?.id)))

  const user = JSON.stringify({
    products: products.map((p) => ({
      id: String(p?.id),
      name: asString(p?.name, 90),
      category: asString(p?.category, 40),
      rating: Number(p?.avgRating) || null,
      reviews: Number(p?.reviewCount) || null,
      verifiedBuyers: Number(p?.verifiedBuyerCount) || null,
      reviewsWithPhotos: Number(p?.reviewsWithPhotos) || null,
      pctRecent: Math.round((Number(p?.recentReviewShare) || 0) * 100),
      pctConsistent: Math.round((Number(p?.ratingConsistency) || 0) * 100),
    })),
  })

  const parsed = await groqJSON('confidence', { system: SYSTEM, user, maxTokens: 3000 })

  // Drop anything malformed or unrecognised rather than failing the request.
  const reasons = {}
  for (const row of asArray(parsed?.reasons)) {
    const id = asString(row?.id, 40)
    const reason = asString(row?.reason, 160)
    if (id && reason && known.has(id)) reasons[id] = reason
  }

  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800')
  return res.status(200).json({ reasons })
}
