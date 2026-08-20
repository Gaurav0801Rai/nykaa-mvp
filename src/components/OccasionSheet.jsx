import { createPortal } from 'react-dom'
import { PICKER_OPTIONS, occasionLabel } from '../lib/occasion'
import { useStore } from '../state/store'
import { sheetHost } from './sheetHost'
import './confidence.css'

// One-tap occasion correction, reachable from the wishlist card. Corrections
// are the user's own answer, so they outrank any later inference.
export default function OccasionSheet({ product, entry, onClose }) {
  const { dispatch, toast } = useStore()
  const host = sheetHost()
  if (!host) return null

  const pick = (tag) => {
    dispatch({ type: 'wish/occasion', id: product.id, tag })
    toast('Tagged as ' + tag)
    onClose()
  }

  return createPortal(
    <div className="sheet-dim" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grab">
          <span />
        </div>
        <div className="sheet-body">
          <h2 className="sheet-title">What did you save this for?</h2>
          <p className="sheet-sub">
            {product.brand} — currently {occasionLabel(entry?.occasionTag).toLowerCase()}
          </p>
          <div className="occ-chips">
            {PICKER_OPTIONS.map((o) => (
              <button
                type="button"
                key={o}
                className={'chip' + (entry?.occasionTag === o ? ' is-active' : '')}
                onClick={() => pick(o)}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
        <div className="sheet-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    host
  )
}
