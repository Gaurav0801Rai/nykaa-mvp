// Which products need a size, and what the options are. Jewellery, watches,
// bags and home goods don't — the bag and the cross-sell strip both rely on
// this so they never open a size picker for a necklace.

export const APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
export const SHOE_SIZES = ['6', '7', '8', '9', '10', '11']

const NO_SIZE_CATEGORIES = new Set([
  'Jewellery', 'Watches', 'Bags', 'Accessories', 'Personal Accessories',
  'Toys & Playtime', 'Personal Care', 'Decor', 'Kitchen & Dining', 'Bedding',
  'Bath', 'Storage', 'Home Essentials', 'Appliances',
])

export const sizesFor = (product) => {
  if (!product || NO_SIZE_CATEGORIES.has(product.category)) return []
  if (product.category === 'Footwear') return SHOE_SIZES
  return APPAREL_SIZES
}

export const needsSize = (product) => sizesFor(product).length > 0

// The user's most-used size, inferred from what is already in the bag, so the
// strip can add in one tap instead of asking every time.
export function preferredSize(product, bagItems = []) {
  const options = sizesFor(product)
  if (!options.length) return null
  const counts = {}
  for (const it of bagItems) {
    if (it.size && options.includes(it.size)) counts[it.size] = (counts[it.size] || 0) + 1
  }
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1])
  if (ranked.length) return ranked[0][0]
  return options === SHOE_SIZES ? '8' : 'M'
}
