import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '../state/store'
import { sheetHost } from './sheetHost'
import './confidence.css'

// Uses the native share sheet where the browser has one; otherwise falls back
// to an in-app sheet, so the control is never dead.
export default function ShareSheet({ product, onClose }) {
  const { toast } = useStore()
  const host = sheetHost()

  const url =
    typeof window !== 'undefined'
      ? window.location.origin + '/p/' + product.id
      : '/p/' + product.id

  const native = typeof navigator !== 'undefined' && !!navigator.share

  useEffect(() => {
    if (!native) return
    navigator
      .share({ title: product.brand + ' - ' + product.name, url })
      .catch(() => {})
      .finally(onClose)
  }, [native, product, url, onClose])

  if (!host || native) return null

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast('Link copied')
    } catch {
      toast('Copy failed - select the link manually')
    }
    onClose()
  }

  return createPortal(
    <div className="sheet-dim" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grab">
          <span />
        </div>
        <div className="sheet-body">
          <h2 className="sheet-title">Share</h2>
          <p className="sheet-sub">
            {product.brand} — {product.name}
          </p>
          <div className="share-link">{url}</div>
        </div>
        <div className="sheet-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn solid" onClick={copy}>
            Copy link
          </button>
        </div>
      </div>
    </div>,
    host
  )
}
