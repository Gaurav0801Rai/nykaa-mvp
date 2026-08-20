import { useState } from 'react'
import { Link, useParams, useNavigate, Navigate } from 'react-router-dom'
import { getProduct, relatedProducts, formatINR } from '../data/catalog'
import ProductCard from '../components/ProductCard'
import './product.css'

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export default function Product() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [size, setSize] = useState(null)

  const product = getProduct(id)
  if (!product) return <Navigate to="/" replace />

  const related = relatedProducts(product)
  const onSale = product.salePrice != null && product.salePrice < product.price

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
        <button className="btn ghost">♡ Wishlist</button>
        <button className="btn solid">Add to bag</button>
      </div>
    </div>
  )
}
