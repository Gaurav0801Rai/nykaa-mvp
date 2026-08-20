import { groqJSON, asString, asArray, readJsonBody, methodGuard } from './_groq.js'

// Infers the occasion an item was likely saved for. Only high-confidence
// inferences are returned to the client; everything else is left for the
// "Not tagged yet" bucket, because a wrong confident tag is worse than no tag.

const ALLOWED = new Set(['Wedding', 'Office', 'Party', 'Everyday'])

const SYSTEM = `You infer what occasion a shopper saved a fashion item for.

Allowed occasions: Wedding, Office, Party, Everyday.

Guidance:
- lehenga, sherwani, bridal wear, heavy ethnic sets -> Wedding
- blazers, formal shirts, formal shoes, tailored trousers -> Office
- sequinned or bodycon dresses, cocktail wear, stilettos, clutches -> Party
- tees, joggers, jeans, sneakers, loungewear, sportswear -> Everyday

Return a confidence between 0 and 1. Be strict: if the item genuinely could
belong to two occasions, or the name is too generic to tell, return a
confidence below 0.7 and we will leave it untagged. Do not guess just to fill
a slot. Home goods and generic accessories are usually untaggable.

Return JSON: {"tags":[{"id":"<product id>","occasion":"<one of the four>","confidence":<0-1>}]}`

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
      brand: asString(p?.brand, 40),
      category: asString(p?.category, 40),
      price: Number(p?.price) || null,
    })),
    medianPriceOfOtherSaves: Number(body?.medianPrice) || null,
  })

  const parsed = await groqJSON('occasion', { system: SYSTEM, user, maxTokens: 900 })

  const tags = {}
  for (const row of asArray(parsed?.tags)) {
    const id = asString(row?.id, 40)
    const occasion = asString(row?.occasion, 20)
    const confidence = Number(row?.confidence)

    if (!id || !known.has(id)) continue
    if (!occasion || !ALLOWED.has(occasion)) continue
    if (!Number.isFinite(confidence) || confidence < 0.7) continue

    tags[id] = { tag: occasion, confidence: Math.min(1, confidence) }
  }

  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800')
  return res.status(200).json({ tags })
}
