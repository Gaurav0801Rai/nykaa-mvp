import { useEffect, useRef, useState } from 'react'
import { crossSell, pairLabel } from './crosssell'
import { confidence } from './confidence'
import { fetchCrossSellPicks } from './api'

// Recompute is debounced on bag change and the previous result stays on screen
// meanwhile, so the strip never flickers or goes empty mid-update.
//
// Order of preference:
//   1. Groq pairing (Mode A) when the bag has contents and the model answers
//   2. the deterministic pairing table (Mode A)
//   3. Confidence + staleness ranking (Mode B)
// All three read from the wishlist only. There is no path to a catalogue item.
export default function useCrossSell(bagProducts, wishEntries, revision = '', limit = 10) {
  const [result, setResult] = useState(() => crossSell(bagProducts, wishEntries, limit))
  const timer = useRef(null)

  // cheap signature of the inputs, so we only recompute on real changes.
  // `revision` carries bag quantities, so changing a quantity re-ranks too.
  const signature =
    bagProducts.map((p) => p.id).join(',') +
    '|' +
    wishEntries.map((w) => w.product.id).join(',') +
    '|' +
    revision

  useEffect(() => {
    clearTimeout(timer.current)
    let cancelled = false

    timer.current = setTimeout(async () => {
      const base = crossSell(bagProducts, wishEntries, limit)
      if (cancelled) return
      setResult(base)

      // Modes B and C have nothing to pair against — leave them deterministic.
      if (base.mode !== 'A') return

      const inBag = new Set(bagProducts.map((p) => p.id))

      // Candidates are restricted to the departments already in the bag before
      // the model ever sees them, so a cross-gender pairing is not something it
      // can return — not merely something we ask it to avoid.
      const bagGenders = new Set(bagProducts.map((p) => p.gender))
      const pool = wishEntries.filter(
        (w) => !inBag.has(w.product.id) && bagGenders.has(w.product.gender)
      )
      if (!pool.length) return

      const picks = await fetchCrossSellPicks(
        bagProducts,
        pool.map((w) => ({ product: w.product, stats: confidence(w.product).stats }))
      )
      if (cancelled || !picks.length) return

      const byId = new Map(pool.map((w) => [w.product.id, w]))
      const items = []
      for (const pick of picks) {
        const hit = byId.get(pick.id)
        if (!hit) continue // never trust an id that is not a saved item
        const c = confidence(hit.product)
        items.push({
          product: hit.product,
          entry: hit.entry,
          confidence: c.score,
          reason:
            pick.rationale ||
            'Pairs well with your ' +
              pairLabel(bagProducts[0]) +
              ' — ' +
              c.stats.avgRating.toFixed(1) +
              '★ from ' +
              c.stats.verifiedBuyerCount.toLocaleString('en-IN') +
              ' buyers',
        })
        if (items.length >= limit) break
      }

      // nothing usable survived validation — keep the deterministic ranking
      if (!items.length) return

      // The model is deliberately strict and often returns only a handful, so
      // top the strip up from the deterministic pairing to keep it scrollable.
      // Its picks stay first, in its order.
      if (items.length < limit) {
        const taken = new Set(items.map((i) => i.product.id))
        for (const extra of base.items) {
          if (taken.has(extra.product.id)) continue
          items.push(extra)
          if (items.length >= limit) break
        }
      }

      setResult({
        mode: 'A',
        heading: 'From your wishlist',
        subtitle: 'Picked to go with your ' + pairLabel(bagProducts[0]),
        items,
      })
    }, 220)

    return () => {
      cancelled = true
      clearTimeout(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, limit])

  return result
}
