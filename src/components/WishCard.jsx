import { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatINR } from '../data/catalog'
import { sizesFor } from '../lib/sizing'
import { useStore, savedLabel } from '../state/store'
import ConfidenceBadge, { ConfidenceReason } from './ConfidenceBadge'
import './wish-card.css'

// The existing product card, plus the wishlist additions. The original card
// layout and styling are untouched — the extras sit beneath it.
export default function WishCard({
  entry,
  product,
  organised = false,
  onOpenConfidence,
  onShare,
  selectMode = false,
  selected = false,
  onToggleSelect,
  onLongPress,
}) {
  const { dispatch, inBag, sizeFor, toast } = useStore()
  const navigate = useNavigate()
  const timer = useRef(null)
  const moved = useRef(false)

  const onSale = product.salePrice != null && product.salePrice < product.price
  const already = inBag(product.id)

  const startPress = () => {
    moved.current = false
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      if (!moved.current) onLongPress?.(product.id)
    }, 480)
  }
  const endPress = () => clearTimeout(timer.current)

  const addToBag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (already) {
      navigate('/bag')
      return
    }
    const size = sizesFor(product).length ? sizeFor(product) : null
    dispatch({ type: 'bag/add', id: product.id, size })
    toast('Added to bag' + (size ? ' - size ' + size : ''))
  }

  const remove = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch({ type: 'wish/remove', id: product.id })
    dispatch({ type: 'toast/show', text: 'Removed from wishlist', undo: true })
  }

  const share = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onShare?.(product)
  }

  const body = (
    <>
      <div className="pcard-media">
        <img src={product.image} alt={product.name} loading="lazy" />

        {selectMode ? (
          <span className={'wcard-check' + (selected ? ' is-on' : '')} aria-hidden="true">
            {selected ? '✓' : ''}
          </span>
        ) : (
          <div className="wcard-tools">
            <button type="button" onClick={share} aria-label="Share">
              {'⤴'}
            </button>
            <button type="button" onClick={remove} aria-label="Remove from wishlist">
              {'✕'}
            </button>
          </div>
        )}
      </div>

      <div className="pcard-body">
        <div className="pcard-brand">{product.brand}</div>
        <div className="pcard-name">{product.name}</div>
        <div className="pcard-price">
          <span className="now">{formatINR(onSale ? product.salePrice : product.price)}</span>
          {onSale && <span className="was">{formatINR(product.price)}</span>}
          {onSale && product.discount > 0 && <span className="off">{product.discount}% off</span>}
        </div>

        {organised && (
          <>
            <div className="wcard-conf">
              <ConfidenceBadge product={product} size="sm" onOpen={onOpenConfidence} />
              <ConfidenceReason product={product} text={entry.confidenceReason} />
            </div>
            <div className="wcard-saved">{savedLabel(entry.savedDate)}</div>
          </>
        )}
      </div>
    </>
  )

  return (
    <div
      className={'pcard wcard' + (selected ? ' is-selected' : '')}
      onPointerDown={startPress}
      onPointerUp={endPress}
      onPointerLeave={endPress}
      onPointerMove={() => {
        moved.current = true
      }}
    >
      {selectMode ? (
        <button
          type="button"
          className="wcard-hit"
          onClick={() => onToggleSelect?.(product.id)}
          aria-pressed={selected}
        >
          {body}
        </button>
      ) : (
        <Link to={'/p/' + product.id} className="wcard-hit">
          {body}
        </Link>
      )}

      {!selectMode && (
        <button
          type="button"
          className={'wcard-add' + (already ? ' is-done' : '')}
          onClick={addToBag}
        >
          {already ? 'Go to Bag' : 'Add to Bag'}
        </button>
      )}
    </div>
  )
}
