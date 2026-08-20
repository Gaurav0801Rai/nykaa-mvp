// Seed wishlist — 44 items across 8 categories, saved 2 to 45 days ago,
// with 4 out of stock and 2 where the size is unavailable.
//
// Every product carries a real category from the catalogue, so the category
// circles never need an "Uncategorized" bucket.

import { getCategory, products as allProducts } from './catalog'
import { inferOccasion } from '../lib/occasion'

const PLAN = [
  ['women', 'westernwear', 7],
  ['women', 'indianwear', 6],
  ['women', 'footwear', 5],
  ['women', 'jewellery', 5],
  ['men', 'topwear', 6],
  ['men', 'bottomwear', 5],
  ['men', 'ethnicwear', 5],
  ['men', 'watches', 5],
]

const OUT_OF_STOCK_AT = [5, 14, 27, 38]
const SIZE_UNAVAILABLE_AT = [9, 33]

const medianPrice = (() => {
  const prices = allProducts.map((p) => p.salePrice ?? p.price).sort((a, b) => a - b)
  return prices[Math.floor(prices.length / 2)]
})()

export function buildSeedWishlist(now = Date.now()) {
  const picked = []

  for (const [genderSlug, catSlug, count] of PLAN) {
    const cat = getCategory(genderSlug, catSlug)
    if (!cat) continue
    // spread the picks through the category rather than taking the first n
    for (let i = 0; i < count; i++) {
      const p = cat.products[(i * 5 + 2) % cat.products.length]
      if (p && !picked.some((x) => x.id === p.id)) picked.push(p)
    }
  }

  return picked.map((product, i) => {
    const inferred = inferOccasion(product, { medianPrice })
    return {
      id: product.id,
      // 2 through 45 days ago, one item per day
      savedDate: new Date(now - (2 + i) * 86400000).toISOString(),
      occasionTag: inferred.tag,
      occasionConfidence: inferred.confidence,
      occasionSource: inferred.tag ? 'inferred' : null,
      notifyMe: false,
      availability: OUT_OF_STOCK_AT.includes(i)
        ? 'out-of-stock'
        : SIZE_UNAVAILABLE_AT.includes(i)
          ? 'size-unavailable'
          : 'in-stock',
    }
  })
}
