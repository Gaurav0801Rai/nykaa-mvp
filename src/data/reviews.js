// The scraped catalogue carries no review data, so the review signals the
// Confidence Score is built from are synthesised here — deterministically, from
// a hash of the product id. The same product always yields the same numbers, on
// every reload and from every surface that asks.

const hash = (str) => {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// xorshift off a salted id, so each signal varies independently of the others
const unit = (id, salt) => {
  let x = hash(id + ':' + salt) || 1
  x ^= x << 13; x >>>= 0
  x ^= x >>> 17
  x ^= x << 5; x >>>= 0
  return x / 4294967296
}

const span = (t, lo, hi) => lo + t * (hi - lo)
const round1 = (n) => Math.round(n * 10) / 10

const OPENERS = [
  'Fit is exactly as described',
  'Fabric feels far better than expected',
  'Wore it twice already',
  'Colour is true to the photos',
  'Stitching is clean throughout',
  'Comfortable enough for a full day',
  'Looks more expensive than it is',
  'Sizing runs true',
]
const CLOSERS = [
  'would order again.',
  'no complaints after a wash.',
  'holds its shape well.',
  'got compliments on it.',
  'delivery was quick too.',
  'worth it for the quality.',
  'exactly what I was looking for.',
  'has become a regular in my rotation.',
]
const MIXED = [
  'Runs slightly loose — size down if you are between sizes.',
  'Colour is a shade deeper in person than on screen.',
  'Good overall, though the fabric is thinner than expected.',
  'Fits well but the length needed a small alteration.',
]

const cache = new Map()

// Raw per-product review signals — the inputs the Confidence Score reads.
export function reviewStats(product) {
  if (cache.has(product.id)) return cache.get(product.id)

  const t = (salt) => unit(product.id, salt)

  // volume skews low so a handful of products dominate, as on a real catalogue
  const reviewCount = Math.round(span(Math.pow(t('vol'), 1.7), 11, 1480))
  const avgRating = round1(span(t('avg'), 3.2, 4.9))
  const verifiedShare = span(t('ver'), 0.55, 0.98)
  const photoShare = span(t('pho'), 0.04, 0.42)

  const stats = {
    reviewCount,
    avgRating,
    verifiedShare,
    verifiedBuyerCount: Math.max(1, Math.round(reviewCount * verifiedShare)),
    photoShare,
    reviewsWithPhotos: Math.round(reviewCount * photoShare),
    recentReviewShare: span(t('rec'), 0.12, 0.85),
    ratingConsistency: span(t('con'), 0.35, 0.96),
    reviews: buildReviews(product, avgRating),
  }

  cache.set(product.id, stats)
  return stats
}

function buildReviews(product, avgRating) {
  const out = []
  const n = 4
  for (let i = 0; i < n; i++) {
    const a = unit(product.id, 'r' + i + 'a')
    const b = unit(product.id, 'r' + i + 'b')
    // one lukewarm review in the set whenever the average leaves room for it
    const mixed = i === n - 1 && avgRating < 4.6
    out.push({
      id: product.id + '-r' + i,
      rating: mixed ? Math.max(3, Math.round(avgRating) - 1) : Math.round(avgRating),
      verified: b > 0.18,
      withPhoto: b > 0.72,
      daysAgo: 3 + Math.round(a * 160),
      text: mixed
        ? MIXED[Math.floor(a * MIXED.length)]
        : OPENERS[Math.floor(a * OPENERS.length)] + ' — ' + CLOSERS[Math.floor(b * CLOSERS.length)],
    })
  }
  return out.sort((x, y) => x.daysAgo - y.daysAgo)
}
