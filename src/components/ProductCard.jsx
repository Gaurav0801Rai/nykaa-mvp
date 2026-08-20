import { Link } from 'react-router-dom'
import { formatINR } from '../data/catalog'
import './product-card.css'

export default function ProductCard({ product, compact = false }) {
  const { id, brand, name, image, price, salePrice, discount } = product
  const onSale = salePrice != null && salePrice < price

  return (
    <Link to={'/p/' + id} className={'pcard' + (compact ? ' pcard--compact' : '')}>
      <div className="pcard-media">
        <img src={image} alt={name} loading="lazy" />
        <button
          className="pcard-wish"
          aria-label="Add to wishlist"
          onClick={(e) => e.preventDefault()}
        >
          ♡
        </button>
      </div>

      <div className="pcard-body">
        <div className="pcard-brand">{brand}</div>
        <div className="pcard-name">{name}</div>
        <div className="pcard-price">
          <span className="now">{formatINR(onSale ? salePrice : price)}</span>
          {onSale && <span className="was">{formatINR(price)}</span>}
          {onSale && discount > 0 && <span className="off">{discount}% off</span>}
        </div>
      </div>
    </Link>
  )
}
