// Display label for the wishlist category circles.
//
// The catalogue's own categories are coarse ("Footwear", "Westernwear"), so we
// read a finer product type off the name where one is obvious — Boots, Jeans,
// Formal Shoes, Watches. When nothing matches we fall back to the catalogue
// category, which every product is guaranteed to have. There is therefore no
// path to an "Uncategorized" circle.

const LABELS = [
  [/\bboots?\b/i, 'Boots'],
  [/\b(flip.?flops?|slippers?)\b/i, 'Flip Flops'],
  [/\b(formal shoes?|oxfords?|brogues?|derbys?|loafers?|moccasins?)\b/i, 'Formal Shoes'],
  [/\b(sneakers?|trainers?|running shoes?)\b/i, 'Sneakers'],
  [/\bsandals?\b/i, 'Sandals'],
  [/\bheels?\b/i, 'Heels'],
  [/\b(watch|watches|chronographs?)\b/i, 'Watches'],
  [/\b(jeans|denims?)\b/i, 'Jeans'],
  [/\b(track ?pants?|joggers?|sweatpants?)\b/i, 'Trackpants'],
  [/\b(trousers?|chinos?|palazzos?)\b/i, 'Trousers'],
  [/\bshorts?\b/i, 'Shorts'],
  [/\bskirts?\b/i, 'Skirts'],
  [/\b(t-?shirts?|tees?)\b/i, 'T-Shirts'],
  [/\bshirts?\b/i, 'Shirts'],
  [/\b(hoodies?|sweatshirts?)\b/i, 'Sweatshirts'],
  [/\b(sweaters?|cardigans?|pullovers?)\b/i, 'Knitwear'],
  [/\b(jackets?|coats?)\b/i, 'Jackets'],
  [/\b(shrugs?|kimonos?)\b/i, 'Shrugs'],
  [/\b(dress|dresses|gowns?)\b/i, 'Dresses'],
  [/\b(kurtas?|kurtis?)\b/i, 'Kurtas'],
  [/\b(sarees?|saris?)\b/i, 'Sarees'],
  [/\blehengas?\b/i, 'Lehengas'],
  [/\b(sherwanis?|ethnic sets?)\b/i, 'Ethnic Sets'],
  [/\b(leggings?|jeggings?)\b/i, 'Leggings'],
  [/\b(earrings?|jhumkas?)\b/i, 'Earrings'],
  [/\b(necklaces?|pendants?|chains?)\b/i, 'Necklaces'],
  [/\b(bangles?|bracelets?|kadas?)\b/i, 'Bracelets'],
  [/\brings?\b/i, 'Rings'],
  [/\b(handbags?|totes?|satchels?|slings?)\b/i, 'Handbags'],
  [/\b(backpacks?|rucksacks?)\b/i, 'Backpacks'],
  [/\b(wallets?|purses?)\b/i, 'Wallets'],
  [/\b(sunglasses|shades|eyewear)\b/i, 'Sunglasses'],
  [/\bbelts?\b/i, 'Belts'],
  [/\b(tops?|blouses?|camisoles?)\b/i, 'Tops'],
]

const cache = new Map()

export function productType(product) {
  if (cache.has(product.id)) return cache.get(product.id)
  let label = product.category
  for (const [re, name] of LABELS) {
    if (re.test(product.name)) {
      label = name
      break
    }
  }
  cache.set(product.id, label)
  return label
}
