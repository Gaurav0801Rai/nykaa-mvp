import { useEffect, useRef } from 'react'
import { confidence } from './confidence'
import { fetchConfidenceReasons, fetchOccasions } from './api'
import { products as allProducts } from '../data/catalog'

const medianPrice = (() => {
  const prices = allProducts.map((p) => p.salePrice ?? p.price).sort((a, b) => a - b)
  return prices[Math.floor(prices.length / 2)]
})()

// Enrichment is computed once per product and cached on the wishlist entry —
// never recomputed on render. Ids we have already asked about are remembered
// for the session so a failed or empty response is not retried in a loop.
const askedReason = new Set()
const askedOccasion = new Set()

const BATCH = 12

export default function useEnrichment(entries, dispatch) {
  const running = useRef(false)

  useEffect(() => {
    if (running.current) return
    if (!entries.length) return

    const needReason = entries
      .filter((x) => !x.entry.confidenceReason && !askedReason.has(x.product.id))
      .slice(0, BATCH)

    const needOccasion = entries
      .filter(
        (x) =>
          !x.entry.occasionTag &&
          x.entry.occasionSource !== 'user' &&
          !askedOccasion.has(x.product.id)
      )
      .slice(0, BATCH)

    if (!needReason.length && !needOccasion.length) return

    running.current = true
    let cancelled = false

    const run = async () => {
      if (needReason.length) {
        needReason.forEach((x) => askedReason.add(x.product.id))
        const payload = needReason.map((x) => ({
          product: x.product,
          stats: confidence(x.product).stats,
        }))
        const reasons = await fetchConfidenceReasons(payload)
        if (!cancelled) {
          for (const [id, reason] of Object.entries(reasons)) {
            dispatch({ type: 'wish/enrich', id, patch: { confidenceReason: reason } })
          }
        }
      }

      if (needOccasion.length) {
        needOccasion.forEach((x) => askedOccasion.add(x.product.id))
        const tags = await fetchOccasions(
          needOccasion.map((x) => x.product),
          medianPrice
        )
        if (!cancelled) {
          for (const [id, value] of Object.entries(tags)) {
            dispatch({
              type: 'wish/enrich',
              id,
              patch: {
                occasionTag: value.tag,
                occasionConfidence: value.confidence,
                occasionSource: 'inferred',
              },
            })
          }
        }
      }

      running.current = false
    }

    run()
    return () => {
      cancelled = true
      running.current = false
    }
  }, [entries, dispatch])
}
