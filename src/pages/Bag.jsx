import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatINR } from '../data/catalog'
import { sizesFor } from '../lib/sizing'
import { useStore } from '../state/store'
import useCrossSell from '../lib/useCrossSell'
import ScreenHeader from '../components/ScreenHeader'
import ConfidenceBadge from '../components/ConfidenceBadge'
import ConfidenceSheet from '../components/ConfidenceSheet'
import './bag.css'

export default function Bag() {
  const { bagLines, available, dispatch, sizeFor, toast } = useStore()

  const [ticked, setTicked] = useState([])
  const [sizingFor, setSizingFor] = useState(null)
  const [sheetProduct, setSheetProduct] = useState(null)

  const bagProducts = bagLines.map((l) => l.product)

  // The strip is sourced from the wishlist only, and unavailable items are
  // already excluded — `available` holds in-stock saves.
  const suggestions = useCrossSell(
    bagProducts,
    available,
    bagLines.map((l) => l.item.qty).join(',')
  )

  const selectedLines = bagLines.filter((l) => l.item.selected)

  const totals = useMemo(() => {
    let mrp = 0
    let pay = 0
    for (const { item, product } of selectedLines) {
      mrp += product.price * item.qty
      pay += (product.salePrice ?? product.price) * item.qty
    }
    return { mrp, pay }
  }, [selectedLines])

  const addSuggestion = (product) => {
    const size = sizesFor(product).length ? sizeFor(product) : null
    dispatch({ type: 'bag/add', id: product.id, size })
    toast('Added to bag' + (size ? ' - size ' + size : ''))
    setTicked((t) => t.filter((id) => id !== product.id))
  }

  const addTicked = () => {
    const items = ticked.map((id) => {
      const hit = suggestions.items.find((s) => s.product.id === id)
      return {
        id,
        size: hit && sizesFor(hit.product).length ? sizeFor(hit.product) : null,
      }
    })
    dispatch({ type: 'bag/addMany', items })
    toast(items.length + (items.length === 1 ? ' item added' : ' items added'))
    setTicked([])
  }

  return (
    <div className="bag">
      <ScreenHeader
        title="Bag"
        subtitle={
          bagLines.length
            ? bagLines.length + (bagLines.length === 1 ? ' item' : ' items')
            : 'empty'
        }
        showBag={false}
        actions={
          <Link to="/wishlist" className="shead-icon" aria-label="Wishlist">
            {'♡'}
          </Link>
        }
      />

      {bagLines.length > 0 && (
        <div className="bag-selrow">
          <button
            type="button"
            className={'bag-check' + (selectedLines.length === bagLines.length ? ' is-on' : '')}
            onClick={() =>
              bagLines.forEach((l) => {
                const shouldSelect = selectedLines.length !== bagLines.length
                if (l.item.selected !== shouldSelect) {
                  dispatch({ type: 'bag/select', id: l.product.id })
                }
              })
            }
            aria-label="Select all items"
          >
            {selectedLines.length === bagLines.length ? '✓' : ''}
          </button>
          <span>
            {selectedLines.length}/{bagLines.length} items selected
          </span>
        </div>
      )}

      {bagLines.length === 0 ? (
        <p className="bag-empty">
          Nothing here yet. Your saved items are below — add one straight from the strip.
        </p>
      ) : (
        <ul className="bag-list">
          {bagLines.map(({ item, product }) => {
            const sizes = sizesFor(product)
            const onSale = product.salePrice != null && product.salePrice < product.price
            return (
              <li className="bag-item" key={product.id}>
                <button
                  type="button"
                  className={'bag-check' + (item.selected ? ' is-on' : '')}
                  onClick={() => dispatch({ type: 'bag/select', id: product.id })}
                  aria-label={item.selected ? 'Deselect item' : 'Select item'}
                >
                  {item.selected ? '✓' : ''}
                </button>

                <div className="bag-media">
                  <img src={product.image} alt={product.name} loading="lazy" />
                </div>

                <div className="bag-info">
                  <div className="bag-brand">{product.brand}</div>
                  <div className="bag-name">{product.name}</div>

                  <div className="bag-price">
                    <span className="now">{formatINR(product.salePrice ?? product.price)}</span>
                    {onSale && <span className="was">{formatINR(product.price)}</span>}
                    {onSale && product.discount > 0 && (
                      <span className="off">{product.discount}% off</span>
                    )}
                  </div>

                  <div className="bag-controls">
                    {sizes.length > 0 && (
                      <label className="bag-select">
                        Size
                        <select
                          value={item.size ?? ''}
                          onChange={(e) =>
                            dispatch({ type: 'bag/size', id: product.id, size: e.target.value })
                          }
                        >
                          {!item.size && <option value="">Select</option>}
                          {sizes.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    <div className="bag-qty">
                      <button
                        type="button"
                        onClick={() => dispatch({ type: 'bag/qty', id: product.id, qty: item.qty - 1 })}
                        disabled={item.qty <= 1}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span>{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => dispatch({ type: 'bag/qty', id: product.id, qty: item.qty + 1 })}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="bag-links">
                    <Link to={'/p/' + product.id}>Quick View</Link>
                    <button
                      type="button"
                      onClick={() => {
                        dispatch({ type: 'bag/remove', id: product.id })
                        toast('Removed from bag')
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Cross-sell strip — always sourced from the wishlist, never the catalogue. */}
      {suggestions.mode !== 'C' && (
        <section className="strip">
          <div className="section-head">
            <div>
              <h2>{suggestions.heading}</h2>
              <p className="strip-sub">{suggestions.subtitle}</p>
            </div>
            {ticked.length > 0 && (
              <button type="button" className="strip-addsel" onClick={addTicked}>
                Add selected ({ticked.length})
              </button>
            )}
          </div>

          <div className="row-scroll">
            {suggestions.items.map(({ product, reason }) => {
              const sizes = sizesFor(product)
              const isPicking = sizingFor === product.id
              return (
                <div className="scard" key={product.id}>
                  <button
                    type="button"
                    className={'scard-tick' + (ticked.includes(product.id) ? ' is-on' : '')}
                    onClick={() =>
                      setTicked((t) =>
                        t.includes(product.id)
                          ? t.filter((x) => x !== product.id)
                          : [...t, product.id]
                      )
                    }
                    aria-label="Select suggestion"
                    aria-pressed={ticked.includes(product.id)}
                  >
                    {ticked.includes(product.id) ? '✓' : ''}
                  </button>

                  <Link to={'/p/' + product.id} className="scard-media">
                    <img src={product.image} alt={product.name} loading="lazy" />
                  </Link>

                  <div className="scard-body">
                    <div className="scard-top">
                      <div className="scard-brand">{product.brand}</div>
                      <ConfidenceBadge product={product} size="sm" onOpen={setSheetProduct} />
                    </div>
                    <div className="scard-name">{product.name}</div>
                    <div className="scard-price">{formatINR(product.salePrice ?? product.price)}</div>
                    <p className="scard-reason">{reason}</p>

                    {isPicking ? (
                      <div className="scard-sizes">
                        {sizes.map((s) => (
                          <button
                            type="button"
                            key={s}
                            className="chip"
                            onClick={() => {
                              dispatch({ type: 'bag/add', id: product.id, size: s })
                              toast('Added to bag - size ' + s)
                              setSizingFor(null)
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="scard-add"
                        onClick={() => {
                          // one tap when a size can be inferred, a compact
                          // in-place picker when it cannot
                          if (sizes.length && !sizeFor(product)) setSizingFor(product.id)
                          else addSuggestion(product)
                        }}
                      >
                        Add to Bag
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {bagLines.length > 0 && (
        <section className="pricing">
          <div className="section-head">
            <h2>Price Details</h2>
          </div>
          <div className="pricing-rows">
            <div className="prow">
              <span>Total MRP</span>
              <span>{formatINR(totals.mrp)}</span>
            </div>
            <div className="prow">
              <span>Delivery</span>
              <span className="prow-free">Free</span>
            </div>
            <div className="prow prow-total">
              <span>You Pay</span>
              <span>{formatINR(totals.pay)}</span>
            </div>
          </div>
        </section>
      )}

      {bagLines.length > 0 && (
        <div className="bag-bar">
          <div className="bag-bar-total">
            <span>You Pay</span>
            <strong>{formatINR(totals.pay)}</strong>
          </div>
          <button
            type="button"
            className="btn solid"
            disabled={!selectedLines.length}
            onClick={() => toast('This is a prototype — checkout is not wired up')}
          >
            Proceed to Buy
          </button>
        </div>
      )}

      {sheetProduct && (
        <ConfidenceSheet
          product={sheetProduct}
          reason={available.find((x) => x.product.id === sheetProduct.id)?.entry.confidenceReason}
          onClose={() => setSheetProduct(null)}
        />
      )}
    </div>
  )
}
