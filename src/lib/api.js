// Client wrappers for the server-side Groq routes.
//
// Every one of these resolves to a benign empty value on any failure — no key
// configured, route missing (plain `vite dev`), network error, rate limit,
// malformed JSON. Callers always have a deterministic path to fall back to, so
// the UI never breaks and never waits on the model.

import { pairLabel } from './crosssell'

const TIMEOUT_MS = 8000

// A 404 means the routes are not deployed at all — plain `vite dev` rather
// than `vercel dev`. That will not change mid-session, so stop asking after
// the first one instead of logging a failed request on every screen.
let routesMissing = false

async function postJSON(path, payload) {
  if (routesMissing) return null

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    if (res.status === 404) {
      routesMissing = true
      return null
    }
    // 429 and 5xx are transient — fall back for this request only
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

// Only the fields the routes need — no key material ever travels this way.
const forConfidence = ({ product, stats }) => ({
  id: product.id,
  name: product.name,
  category: product.category,
  avgRating: stats.avgRating,
  reviewCount: stats.reviewCount,
  verifiedBuyerCount: stats.verifiedBuyerCount,
  reviewsWithPhotos: stats.reviewsWithPhotos,
  recentReviewShare: stats.recentReviewShare,
  ratingConsistency: stats.ratingConsistency,
})

export async function fetchConfidenceReasons(items) {
  if (!items.length) return {}
  const data = await postJSON('/api/confidence-reason', {
    products: items.map(forConfidence),
  })
  return data?.reasons && typeof data.reasons === 'object' ? data.reasons : {}
}

export async function fetchOccasions(products, medianPrice) {
  if (!products.length) return {}
  const data = await postJSON('/api/occasion', {
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      category: p.category,
      price: p.salePrice ?? p.price,
    })),
    medianPrice,
  })
  return data?.tags && typeof data.tags === 'object' ? data.tags : {}
}

export async function fetchCrossSellPicks(bagProducts, candidates) {
  if (!bagProducts.length || !candidates.length) return []
  const data = await postJSON('/api/crosssell', {
    bag: bagProducts.map((p) => ({
      label: pairLabel(p),
      name: p.name,
      category: p.category,
    })),
    candidates: candidates.map(({ product, stats }) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      avgRating: stats.avgRating,
      verifiedBuyerCount: stats.verifiedBuyerCount,
    })),
  })
  return Array.isArray(data?.picks) ? data.picks : []
}
