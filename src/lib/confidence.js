// Confidence Score — how well validated an item is by other buyers.
//
// It is NOT an authenticity, genuineness or trust score, and must never be
// labelled as one. It reads review data only: volume, verified-purchase share,
// average rating, photo share, recency and rating consistency.

import { reviewStats } from '../data/reviews'

const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n)

// Each row carries its own weight; the weights sum to 100 so a row's
// contribution bar is directly readable as "points out of the score".
const ROWS = [
  {
    key: 'buyers',
    label: 'Verified buyers',
    weight: 42,
    // volume and verified share are folded together: a high share of a tiny
    // sample should not score like a high share of a thousand reviews
    part: (s) => {
      const volume = clamp01(Math.log10(s.reviewCount + 1) / Math.log10(1500))
      return clamp01(volume * 0.55 + s.verifiedShare * 0.45)
    },
    value: (s) => s.verifiedBuyerCount.toLocaleString('en-IN') + ' of ' + s.reviewCount.toLocaleString('en-IN'),
  },
  {
    key: 'rating',
    label: 'Average rating',
    weight: 24,
    part: (s) => clamp01((s.avgRating - 3) / 1.9),
    value: (s) => s.avgRating.toFixed(1) + '★',
  },
  {
    key: 'photos',
    label: 'Reviews with photos',
    weight: 12,
    part: (s) => clamp01(s.photoShare / 0.4),
    value: (s) => s.reviewsWithPhotos.toLocaleString('en-IN'),
  },
  {
    key: 'recency',
    label: 'Review recency',
    weight: 12,
    part: (s) => clamp01(s.recentReviewShare),
    value: (s) => Math.round(s.recentReviewShare * 100) + '% in last 90 days',
  },
  {
    key: 'consistency',
    label: 'Rating consistency',
    weight: 10,
    part: (s) => clamp01(s.ratingConsistency),
    value: (s) => Math.round(s.ratingConsistency * 100) + '% agree',
  },
]

const cache = new Map()

export function confidence(product) {
  if (cache.has(product.id)) return cache.get(product.id)

  const stats = reviewStats(product)
  const rows = ROWS.map((r) => {
    const part = r.part(stats)
    return {
      key: r.key,
      label: r.label,
      value: r.value(stats),
      points: Math.round(part * r.weight),
      max: r.weight,
      fill: part,
    }
  })

  const score = Math.min(99, rows.reduce((sum, r) => sum + r.points, 0))
  const { why, evidence } = reasonFor(product, stats, rows)
  const result = { score, rows, stats, why, evidence, reason: why + ' ' + evidence }

  cache.set(product.id, result)
  return result
}

// Two lines, deliberately: the first says why the item is worth buying in
// plain language, the second shows the evidence behind it. A number on its own
// is not decision support, and neither is a claim without the numbers.
//
// The "why" line is what the LLM rewrites when a key is configured; the
// evidence line is pure data and is always computed here.
export function reasonFor(product, stats, rows) {
  return { why: whyLine(product, stats, rows), evidence: evidenceLine(stats) }
}

export const evidenceLine = (stats) =>
  stats.avgRating.toFixed(1) +
  '★ from ' +
  stats.verifiedBuyerCount.toLocaleString('en-IN') +
  ' verified buyers, ' +
  stats.reviewsWithPhotos.toLocaleString('en-IN') +
  ' with photos'

function whyLine(product, stats, rows) {
  const noun = (product.category || 'item').toLowerCase().replace(/s$/, '')

  if (stats.reviewCount < 40) {
    return 'Early days — too few reviews to be sure yet.'
  }

  // lead with whichever signal this product is genuinely strongest on
  const lead = [...rows].sort((a, b) => b.fill - a.fill)[0]
  switch (lead.key) {
    case 'photos':
      return 'Buyers keep posting photos, so you can see the real thing first.'
    case 'recency':
      return 'Still being bought and reviewed this month, not a stale listing.'
    case 'consistency':
      return 'Ratings barely vary — what arrives is what people expect.'
    case 'rating':
      return 'One of the best-rated ' + noun + ' pieces you have saved.'
    default:
      return 'Backed by a large number of verified purchases.'
  }
}

export const scoreBand = (score) =>
  score >= 80 ? 'high' : score >= 60 ? 'mid' : 'low'
