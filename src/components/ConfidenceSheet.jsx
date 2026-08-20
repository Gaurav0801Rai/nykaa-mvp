import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { confidence, scoreBand } from '../lib/confidence'
import { useStore } from '../state/store'
import { sizesFor } from '../lib/sizing'
import { sheetHost } from './sheetHost'
import './confidence.css'

// Breakdown for the Confidence Score. Closes on the dim area, on a downward
// swipe, or on Move to Bag.
export default function ConfidenceSheet({ product, reason: reasonOverride, onClose }) {
  const { dispatch, sizeFor, toast } = useStore()
  const [showReviews, setShowReviews] = useState(false)
  const drag = useRef(null)
  const host = sheetHost()

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!product || !host) return null

  const { score, rows, stats, reason: fallbackReason } = confidence(product)
  const reason = reasonOverride || fallbackReason
  const band = scoreBand(score)

  const moveToBag = () => {
    const size = sizesFor(product).length ? sizeFor(product) : null
    dispatch({ type: 'bag/add', id: product.id, size })
    toast('Moved to bag' + (size ? ' · size ' + size : ''))
    onClose()
  }

  // swipe-to-dismiss on the grab handle
  const onPointerDown = (e) => {
    drag.current = e.clientY
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onPointerUp = (e) => {
    if (drag.current != null && e.clientY - drag.current > 60) onClose()
    drag.current = null
  }

  return createPortal(
    <div
      className="sheet-dim"
      role="dialog"
      aria-modal="true"
      aria-label={'Why this scores ' + score}
      onClick={onClose}
    >
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div
          className="sheet-grab"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => { drag.current = null }}
        >
          <span />
        </div>

        <div className="sheet-body">
          <h2 className="sheet-title">Why this scores {score}</h2>
          <p className="sheet-sub">
            Confidence Score — how well validated this item is by other buyers.
          </p>

          <div className="sheet-hero">
            <div className={'ring-lg is-' + band} style={{ '--pct': score }}>
              <span className="ring-lg-num">{score}</span>
            </div>
            <div className="sheet-hero-copy">
              <strong>{product.brand}</strong>
              <p>{reason}</p>
              <p>Based on {stats.reviewCount.toLocaleString('en-IN')} reviews.</p>
            </div>
          </div>

          <div className="brk">
            {rows.map((r) => (
              <div className="brk-row" key={r.key}>
                <div className="brk-top">
                  <span className="brk-label">{r.label}</span>
                  <span className="brk-value">{r.value}</span>
                </div>
                <div className="brk-bar">
                  <div className="brk-fill" style={{ width: Math.round(r.fill * 100) + '%' }} />
                </div>
                <div className="brk-pts">
                  contributes {r.points} of {r.max} points
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="btn ghost"
            style={{ width: '100%', marginTop: 12 }}
            onClick={() => setShowReviews((v) => !v)}
          >
            {showReviews ? 'Hide reviews' : 'View reviews'}
          </button>

          {showReviews && (
            <div className="revs">
              {stats.reviews.map((r) => (
                <div className="rev" key={r.id}>
                  <div className="rev-top">
                    <span className="rev-stars">{r.rating}.0★</span>
                    {r.verified && <span className="rev-flag">Verified buyer</span>}
                    {r.withPhoto && <span className="rev-flag">With photo</span>}
                    <span className="rev-when">{r.daysAgo}d ago</span>
                  </div>
                  <p>{r.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sheet-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn solid" onClick={moveToBag}>
            Move to Bag
          </button>
        </div>
      </div>
    </div>,
    host
  )
}
