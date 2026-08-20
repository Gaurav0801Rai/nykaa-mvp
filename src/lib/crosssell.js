// Cross-sell pairing for the Bag strip.
//
// The strip is ALWAYS sourced from the wishlist — never the general catalogue.
// Only the ranking changes:
//   Mode A  bag has pairable contents  -> complementary saved items + rationale
//   Mode B  bag empty / nothing pairs  -> saved items by Confidence + staleness
//   Mode C  wishlist genuinely empty   -> caller hides the strip
//
// This module is the deterministic path. It is also the fallback the LLM path
// drops to, which is why Mode B must never degrade into random products.

import { confidence } from './confidence'

const TYPE_RULES = [
  ['ethnic-top', /\b(kurta|kurti|sherwani|anarkali|salwar|saree|sari|lehenga|choli|blouse)s?\b/i],
  ['ethnic-foot', /\b(jutti|mojari|kolhapuri)s?\b/i],
  ['jewellery', /\b(necklace|earring|jhumka|bangle|bracelet|ring|pendant|maang|anklet|jewellery)s?\b/i],
  ['watch', /\b(watch|chronograph|timepiece)e?s?\b/i],
  ['belt', /\bbelts?\b/i],
  ['sunglasses', /\b(sunglass|shades|eyewear)e?s?\b/i],
  ['clutch', /\b(clutch|potli|sling bag)e?s?\b/i],
  ['bag', /\b(bag|backpack|tote|handbag|satchel|wallet)s?\b/i],
  ['formal-foot', /\b(oxford|brogue|derby|loafer|formal shoe|moccasin)s?\b/i],
  ['sport-foot', /\b(sneaker|running shoe|trainer|trekking shoe|hiking shoe|sports shoe)s?\b/i],
  ['outdoor-bottom', /\b(trekking|hiking|cargo|convertible) (trouser|pant)s?\b/i],
  ['formal-top', /\b(blazer|formal shirt|waistcoat|suit)s?\b/i],
  ['bottomwear', /\b(jean|denim|trouser|chino|jogger|track ?pant|legging|palazzo|short|skirt|culotte|harem ?pant|dungaree)s?\b/i],
  ['topwear', /\b(t-?shirt|tee|top|shirt|hoodie|sweatshirt|sweater|cardigan|dress|jacket|shrug|kimono|kaftan|tunic|coat|poncho|co-?ord)s?\b/i],
  ['footwear', /\b(shoe|sandal|heel|flat|slipper|boot|mule|wedge|espadrille)s?\b/i],
]

const CATEGORY_TYPES = {
  Jewellery: 'jewellery', Watches: 'watch', Bags: 'bag', Footwear: 'footwear',
  Topwear: 'topwear', Bottomwear: 'bottomwear', Indianwear: 'ethnic-top',
  Ethnicwear: 'ethnic-top', Accessories: 'accessory', 'Personal Accessories': 'accessory',
}

export function typeOf(product) {
  const hay = (product.name || '') + ' ' + (product.category || '')
  for (const [type, re] of TYPE_RULES) if (re.test(hay)) return type
  return CATEGORY_TYPES[product.category] || 'other'
}

// What goes with what, and how strongly. Mirrors the pairings in the brief:
// jeans -> tee/sneakers/belt, kurta -> juttis/jewellery/clutch, and so on.
const AFFINITY = {
  bottomwear: { topwear: 1, 'sport-foot': 0.9, belt: 0.85, footwear: 0.7, bag: 0.4 },
  topwear: { bottomwear: 1, 'sport-foot': 0.8, footwear: 0.6, watch: 0.5, bag: 0.4 },
  'formal-top': { bottomwear: 0.9, 'formal-foot': 1, belt: 0.9, watch: 0.8, bag: 0.5 },
  'ethnic-top': { 'ethnic-foot': 1, jewellery: 0.95, clutch: 0.9, bag: 0.4, footwear: 0.5 },
  'outdoor-bottom': { 'sport-foot': 1, sunglasses: 0.9, topwear: 0.7, bag: 0.5 },
  watch: { belt: 1, 'formal-foot': 0.9, 'formal-top': 0.7, bag: 0.4 },
  belt: { 'formal-foot': 0.9, watch: 0.85, bottomwear: 0.7, 'formal-top': 0.6 },
  footwear: { bottomwear: 0.8, topwear: 0.6, bag: 0.5, sunglasses: 0.4 },
  'sport-foot': { bottomwear: 0.9, topwear: 0.7, sunglasses: 0.5 },
  'formal-foot': { 'formal-top': 0.9, belt: 0.9, bottomwear: 0.7, watch: 0.6 },
  jewellery: { 'ethnic-top': 0.9, clutch: 0.7, topwear: 0.4 },
  clutch: { 'ethnic-top': 0.8, jewellery: 0.7, footwear: 0.5 },
  bag: { topwear: 0.4, bottomwear: 0.4, footwear: 0.4 },
  'ethnic-foot': { 'ethnic-top': 1, jewellery: 0.6, clutch: 0.6 },
  accessory: { topwear: 0.4, bottomwear: 0.4 },
  sunglasses: { topwear: 0.5, 'sport-foot': 0.5 },
  other: {},
}

const NOUN = {
  bottomwear: 'bottoms', topwear: 'top', 'formal-top': 'blazer', 'ethnic-top': 'ethnic set',
  'outdoor-bottom': 'trekking trousers', watch: 'watch', belt: 'belt', bag: 'bag',
  footwear: 'shoes', 'sport-foot': 'sneakers', 'formal-foot': 'formal shoes',
  jewellery: 'jewellery', clutch: 'clutch', 'ethnic-foot': 'juttis',
  sunglasses: 'sunglasses', accessory: 'accessory', other: 'item',
}

// A short human label for the bag item the strip is pairing against.
export const pairLabel = (product) => {
  const t = typeOf(product)
  const colour = (product.name.match(/\b(black|white|blue|navy|green|red|pink|beige|grey|gray|olive|brown|cream|yellow|maroon)\b/i) || [])[0]
  const noun = NOUN[t] || 'item'
  return colour ? colour.toLowerCase() + ' ' + noun : noun
}

const daysSince = (iso) => Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 86400000))

/**
 * @param bagProducts   products currently in the bag
 * @param wishEntries   [{ entry, product }] — callers pass availability-filtered items
 * @returns { mode: 'A'|'B'|'C', heading, subtitle, items: [{ product, reason, score }] }
 */
export function crossSell(bagProducts, wishEntries, limit = 10) {
  const inBag = new Set(bagProducts.map((p) => p.id))
  const pool = wishEntries.filter((w) => !inBag.has(w.product.id))

  if (!pool.length) {
    return { mode: 'C', heading: null, subtitle: null, items: [] }
  }

  if (bagProducts.length) {
    const anchors = bagProducts.map((p) => ({ product: p, type: typeOf(p) }))
    const scored = []

    for (const w of pool) {
      const t = typeOf(w.product)
      let best = 0
      let bestAnchor = null
      for (const a of anchors) {
        const affinity = AFFINITY[a.type]?.[t] ?? 0
        if (affinity > best) { best = affinity; bestAnchor = a.product }
      }
      if (best <= 0) continue
      const c = confidence(w.product)
      scored.push({
        product: w.product,
        entry: w.entry,
        score: best * 0.65 + (c.score / 100) * 0.35,
        reason: 'Pairs well with your ' + pairLabel(bestAnchor) + ' — ' +
          c.stats.avgRating.toFixed(1) + '★ from ' + c.stats.verifiedBuyerCount.toLocaleString('en-IN') + ' buyers',
        confidence: c.score,
      })
    }

    if (scored.length) {
      scored.sort((a, b) => b.score - a.score)
      return {
        mode: 'A',
        heading: 'From your wishlist',
        subtitle: 'Picked to go with your ' + pairLabel(bagProducts[0]),
        items: scored.slice(0, limit),
      }
    }
  }

  // Mode B — still the wishlist, ranked by how well validated and how long saved.
  const scored = pool.map((w) => {
    const c = confidence(w.product)
    const staleness = Math.min(1, daysSince(w.entry.savedDate) / 45)
    return {
      product: w.product,
      entry: w.entry,
      score: (c.score / 100) * 0.7 + staleness * 0.3,
      reason: c.reason,
      confidence: c.score,
    }
  })
  scored.sort((a, b) => b.score - a.score)

  return {
    mode: 'B',
    heading: 'Still in your wishlist',
    subtitle: 'Saved items worth a second look',
    items: scored.slice(0, limit),
  }
}
