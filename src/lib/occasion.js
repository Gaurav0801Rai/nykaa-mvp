// Occasion inference — deterministic rule pass.
//
// This is the fallback the LLM path degrades to, and it is also what runs
// before any key is configured. A wrong confident tag is worse than no tag, so
// anything that does not clear the threshold lands in "Not tagged yet".

export const OCCASIONS = ['Wedding', 'Office', 'Party', 'Everyday']
export const PICKER_OPTIONS = [...OCCASIONS, 'Just browsing']

// Strong cues name the garment outright; soft cues only tip a decision.
const RULES = [
  { tag: 'Wedding', w: 0.95, re: /\b(lehenga|sherwani|bridal|wedding|anarkali|banarasi|kanjeevaram|kanjivaram|sangeet|mehendi|zari|sharara|gharara|salwar|churidar|dhoti|nehru jacket)s?\b/i },
  { tag: 'Wedding', w: 0.88, re: /\b(kurta set|ethnic set|unstitched|blouse piece|dupatta set)s?\b/i },
  { tag: 'Wedding', w: 0.64, re: /\b(saree|sari|dupatta|jutti|mojari|brocade|embroider\w*)s?\b/i },

  { tag: 'Office', w: 0.92, re: /\b(blazer|formal|oxford|brogue|waistcoat|tailored|workwear|pencil skirt|laptop)s?\b/i },
  { tag: 'Office', w: 0.52, re: /\b(trouser|chino|loafer|satchel|shirt|derby|moccasin)s?\b/i },

  { tag: 'Party', w: 0.93, re: /\b(sequ\w*|bodycon|cocktail|shimmer|glitter|sparkl\w*|stiletto|clutch|embellish\w*|halter|off.shoulder)s?\b/i },
  { tag: 'Party', w: 0.66, re: /\b(gown|heel|satin|velvet|party|mesh|sheer|bodysuit)s?\b/i },

  { tag: 'Everyday', w: 0.9, re: /\b(t-?shirt|tee|jogger|track ?pant|tracksuit|sweatshirt|hoodie|sneaker|legging|short|pyjama|pajama|slipper|flip.?flop|night ?suit|romper|dungaree|cargo|sweater|cardigan)s?\b/i },
  { tag: 'Everyday', w: 0.86, re: /\b(kurti|palazzo|sports bra|athleisure|gym|yoga|running|lounge|co-?ord)s?\b/i },
  { tag: 'Everyday', w: 0.52, re: /\b(jean|denim|casual|cotton|top|skirt|jacket|sandal|bag)s?\b/i },
]

// Department-level cues, weaker still — a category alone rarely settles it.
const CATEGORY_HINTS = {
  'Active & Sports': ['Everyday', 0.68],
  'Sports & Athleisure': ['Everyday', 0.68],
  'Innerwear & Sleepwear': ['Everyday', 0.66],
  Sleepwear: ['Everyday', 0.66],
  Innerwear: ['Everyday', 0.66],
  Winterwear: ['Everyday', 0.64],
  Infant: ['Everyday', 0.64],
  Westernwear: ['Everyday', 0.5],
  Topwear: ['Everyday', 0.5],
  Bottomwear: ['Everyday', 0.5],
  Ethnicwear: ['Wedding', 0.5],
  Indianwear: ['Wedding', 0.5],
  'Maternity Wear': ['Everyday', 0.5],
  Watches: ['Office', 0.42],
}

const THRESHOLD = 0.62

// `context.medianPrice` is the median of the user's other saves — an item well
// above their own norm leans occasion-wear, well below leans everyday.
export function inferOccasion(product, context = {}) {
  const hay = (product.name || '') + ' ' + (product.category || '') + ' ' + (product.brand || '')
  const tally = {}
  const bump = (tag, w) => { tally[tag] = Math.max(tally[tag] || 0, w) }

  for (const r of RULES) if (r.re.test(hay)) bump(r.tag, r.w)

  const hint = CATEGORY_HINTS[product.category]
  if (hint) bump(hint[0], hint[1])

  const price = product.salePrice ?? product.price
  const median = context.medianPrice
  if (median && price) {
    const ratio = price / median
    if (ratio >= 2) {
      for (const t of ['Wedding', 'Party']) if (tally[t]) tally[t] = Math.min(0.97, tally[t] + 0.12)
    } else if (ratio <= 0.5) {
      if (tally.Everyday) tally.Everyday = Math.min(0.97, tally.Everyday + 0.12)
    }
  }

  const ranked = Object.entries(tally).sort((a, b) => b[1] - a[1])
  if (!ranked.length) return { tag: null, confidence: 0, level: 'low' }

  const [tag, score] = ranked[0]
  const runnerUp = ranked[1]?.[1] ?? 0

  // two occasions cueing almost equally is not a confident read
  if (runnerUp && score - runnerUp < 0.08) {
    return { tag: null, confidence: score, level: 'low' }
  }

  return {
    tag: score >= THRESHOLD ? tag : null,
    confidence: Number(score.toFixed(2)),
    level: score >= THRESHOLD ? 'high' : 'low',
  }
}

// It is an inference, not a fact — the UI always says so.
export const occasionLabel = (tag) => (tag ? 'Looks like: ' + tag : 'Not tagged yet')
