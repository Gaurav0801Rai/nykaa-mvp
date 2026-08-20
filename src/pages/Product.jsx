import { useState } from 'react'
import { Link, useParams, useNavigate, Navigate } from 'react-router-dom'
import { getProduct, relatedProducts, formatINR } from '../data/catalog'
import { confidence } from '../lib/confidence'
import { useStore } from '../state/store'
import ProductCard from '../components/ProductCard'
import ConfidenceBadge, { ConfidenceReason } from '../components/ConfidenceBadge'
import ConfidenceSheet from '../components/ConfidenceSheet'
import './product.css'

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export default function Product() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [size, setSize] = useState(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const { entries, isWished, inBag, dispatch, toast } = useStore()

  const product = getProduct(id)
  if (!product) return <Navigate to="/" replace />

  const related = relatedProducts(product)
  const onSale = product.salePrice != null && product.salePrice < product.price

  const { stats } = confidence(product)
  const wished = isWished(product.id)
  const alreadyInBag = inBag(product.id)

  // an item held on the unavailable list cannot be added to the bag
  const entry = entries.find((x) => x.product.id === product.id)?.entry
  const unavailable = entry && entry.availability !== 'in-stock'

  const toggleWish = () => {
    if (wished) {
      dispatch({ type: 'wish/remove', id: product.id })
      dispatch({ type: 'toast/show', text: 'Removed from wishlist', undo: true })
    } else {
      dispatch({ type: 'wish/add', product })
      toast('Saved to wishlist')
    }
  }

  const addToBag = () => {
    if (alreadyInBag) {
      navigate('/bag')
      return
    }
    dispatch({ type: 'bag/add', id: product.id, size })
    toast('Added to bag' + (size ? ' - size ' + size : ''))
  }

  return (
    <div className="pdp">
      <button className="pdp-back" onClick={() => navigate(-1)} aria-label="Go back">
        ‹
      </button>

      <div className="pdp-media">
        <img src={product.image} alt={product.name} />
      </div>

      <div className="pdp-info">
        <div className="pdp-brand">{product.brand}</div>
        <h1 className="pdp-name">{product.name}</h1>

        <div className="pdp-price">
          <span className="now">
            {formatINR(onSale ? product.salePrice : product.price)}
          </span>
          {onSale && <span className="was">{formatINR(product.price)}</span>}
          {onSale && product.discount > 0 && (
            <span className="off">{product.discount}% off</span>
          )}
        </div>
        <p className="pdp-tax">Inclusive of all taxes</p>

        <div className="pdp-conf">
          <div className="pdp-rating">
            <span className="pdp-stars">{stats.avgRating.toFixed(1)}★</span>
            <span className="pdp-rating-n">
              {stats.reviewCount.toLocaleString('en-IN')} reviews
            </span>
          </div>
          <div className="pdp-conf-badge">
            <ConfidenceBadge product={product} onOpen={() => setSheetOpen(true)} />
            <div className="pdp-conf-copy">
              <button type="button" className="pdp-conf-label" onClick={() => setSheetOpen(true)}>
                Confidence Score
              </button>
              <ConfidenceReason product={product} text={entry?.confidenceReason} />
            </div>
          </div>
        </div>

        <div className="pdp-tags">
          <Link className="tag" to={`/c/${product.gender.toLowerCase()}`}>
            {product.gender}
          </Link>
          <Link
            className="tag"
            to={`/c/${product.gender.toLowerCase()}/${product.categorySlug}`}
          >
            {product.category}
          </Link>
        </div>

        <div className="pdp-block">
          <h3>Select size</h3>
          <div className="sizes">
            {SIZES.map((s) => (
              <button
                key={s}
                className={'size' + (size === s ? ' is-active' : '')}
                onClick={() => setSize(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="pdp-block">
          <h3>Delivery</h3>
          <p className="pdp-copy">Free delivery on orders above ₹999. Easy 15-day returns.</p>
        </div>
      </div>

      {related.length > 0 && (
        <section className="pdp-related">
          <div className="section-head">
            <h2>You may also like</h2>
          </div>
          <div className="row-scroll">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} compact />
            ))}
          </div>
        </section>
      )}

      <div className="pdp-actions">
        <button type="button" className="btn ghost" onClick={toggleWish}>
          {wished ? '♥ Wishlisted' : '♡ Wishlist'}
        </button>
        <button type="button" className="btn solid" onClick={addToBag} disabled={unavailable}>
          {unavailable
            ? entry.availability === 'out-of-stock'
              ? 'Out of stock'
              : 'Your size unavailable'
            : alreadyInBag
              ? 'Go to bag'
              : 'Add to bag'}
        </button>
      </div>

      {sheetOpen && (
        <ConfidenceSheet
          product={product}
          reason={entry?.confidenceReason}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </div>
  )
}
