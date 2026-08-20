import { Link, useNavigate } from 'react-router-dom'
import { formatINR } from '../data/catalog'
import { useStore, savedLabel } from '../state/store'
import './unavailable.css'

const STATUS = {
  'out-of-stock': 'Out of stock',
  'size-unavailable': 'Your size unavailable',
}

// These items are held out of the main wishlist grid and out of every
// cross-sell suggestion, so the main list stays actionable.
export default function Unavailable() {
  const { unavailable, dispatch, toast } = useStore()
  const navigate = useNavigate()

  return (
    <div className="un">
      <div className="sub-head">
        <button type="button" className="sub-back" onClick={() => navigate(-1)} aria-label="Go back">
          {'‹'}
        </button>
        <div>
          <h1>Currently unavailable ({unavailable.length})</h1>
          <p>Moved here so your main list stays actionable</p>
        </div>
      </div>

      {unavailable.length === 0 ? (
        <p className="un-empty">Everything in your wishlist is available right now.</p>
      ) : (
        <ul className="un-list">
          {unavailable.map(({ entry, product }) => (
            <li className="un-row" key={product.id}>
              <Link to={'/p/' + product.id} className="un-main">
                <div className="un-media">
                  <img src={product.image} alt={product.name} loading="lazy" />
                </div>
                <div className="un-info">
                  <div className="un-brand">{product.brand}</div>
                  <div className="un-name">{product.name}</div>
                  <div className="un-price">
                    {formatINR(product.salePrice ?? product.price)}
                  </div>
                  <span className="un-pill">{STATUS[entry.availability]}</span>
                  <div className="un-saved">{savedLabel(entry.savedDate)}</div>
                </div>
              </Link>

              <div className="un-actions">
                <button
                  type="button"
                  className={'un-notify' + (entry.notifyMe ? ' is-on' : '')}
                  onClick={() => {
                    dispatch({ type: 'wish/notify', id: product.id })
                    toast(entry.notifyMe ? 'Notifications off' : 'We will let you know')
                  }}
                >
                  {entry.notifyMe ? "We'll notify you" : 'Notify me'}
                </button>
                <button
                  type="button"
                  className="un-del"
                  aria-label="Remove"
                  onClick={() => {
                    dispatch({ type: 'wish/remove', id: product.id })
                    dispatch({ type: 'toast/show', text: 'Removed from wishlist', undo: true })
                  }}
                >
                  {'✕'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
