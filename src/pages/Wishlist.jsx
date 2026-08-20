import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore, daysAgo } from '../state/store'
import { confidence } from '../lib/confidence'
import { PICKER_OPTIONS } from '../lib/occasion'
import { productType } from '../lib/productType'
import { sizesFor } from '../lib/sizing'
import useEnrichment from '../lib/useEnrichment'
import ScreenHeader from '../components/ScreenHeader'
import WishCard from '../components/WishCard'
import ConfidenceSheet from '../components/ConfidenceSheet'
import ShareSheet from '../components/ShareSheet'
import OccasionSheet from '../components/OccasionSheet'
import './wishlist.css'

export default function Wishlist() {
  const { available, unavailable, categories, dispatch, sizeFor, toast } = useStore()

  const [view, setView] = useState('all')
  const [activeCategory, setActiveCategory] = useState(null)
  const [sheetProduct, setSheetProduct] = useState(null)
  const [shareProduct, setShareProduct] = useState(null)
  const [tagProduct, setTagProduct] = useState(null)
  const [selection, setSelection] = useState(null)
  const [promptDismissed, setPromptDismissed] = useState(false)

  // fills in LLM-written reason lines and occasion tags, cached on each entry
  useEnrichment(available, dispatch)

  const filtered = useMemo(
    () => (activeCategory ? available.filter((x) => productType(x.product) === activeCategory) : available),
    [available, activeCategory]
  )

  // Organised view regroups the SAME items by category, ranked inside each
  // section by Confidence Score, highest first.
  const sections = useMemo(() => {
    const map = new Map()
    for (const x of filtered) {
      const key = productType(x.product)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(x)
    }
    return [...map.entries()]
      .map(([name, items]) => ({
        name,
        items: [...items].sort((a, b) => confidence(b.product).score - confidence(a.product).score),
      }))
      .sort((a, b) => b.items.length - a.items.length)
  }, [filtered])

  // Lazy capture: an item saved 14+ days ago that is still untagged gets a
  // small inline prompt. Never blocking, never attached to the save action.
  const stalePrompt = useMemo(() => {
    if (promptDismissed) return null
    return (
      available.find((x) => !x.entry.occasionTag && daysAgo(x.entry.savedDate) >= 14) || null
    )
  }, [available, promptDismissed])

  const selectMode = selection !== null
  const selectedIds = selection ?? []

  const toggleSelect = (id) =>
    setSelection((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    )

  const startSelection = (id) => setSelection((cur) => (cur === null ? [id] : cur))

  const moveSelectedToBag = () => {
    const items = selectedIds.map((id) => {
      const hit = available.find((x) => x.product.id === id)
      return {
        id,
        size: hit && sizesFor(hit.product).length ? sizeFor(hit.product) : null,
      }
    })
    dispatch({ type: 'bag/addMany', items })
    toast(items.length + (items.length === 1 ? ' item moved to bag' : ' items moved to bag'))
    setSelection(null)
  }

  const removeSelected = () => {
    dispatch({ type: 'wish/removeMany', ids: selectedIds })
    toast(selectedIds.length + (selectedIds.length === 1 ? ' item removed' : ' items removed'))
    setSelection(null)
  }

  if (!available.length && !unavailable.length) {
    return (
      <div className="wl-empty">
        <h1>Wishlist</h1>
        <p>Items you save will appear here.</p>
        <Link to="/" className="btn solid wl-empty-cta">
          Start browsing
        </Link>
      </div>
    )
  }

  return (
    <div className="wl">
      <ScreenHeader
        title="Wishlist"
        subtitle={available.length + ' items'}
        actions={
          <button
            type="button"
            className={'shead-icon' + (selectMode ? ' is-on' : '')}
            onClick={() => setSelection(selectMode ? null : [])}
            aria-label={selectMode ? 'Exit selection' : 'Select items'}
            aria-pressed={selectMode}
          >
            {'☷'}
          </button>
        }
      />

      <div className="row-scroll chips">
        <Link to="/collections" className="chip">
          Collections
        </Link>
        <Link to="/unavailable" className="chip">
          Out of Stock{unavailable.length ? ' (' + unavailable.length + ')' : ''}
        </Link>
        {activeCategory && (
          <button type="button" className="chip is-active" onClick={() => setActiveCategory(null)}>
            Clear
          </button>
        )}
      </div>

      {categories.length > 0 && (
        <div className="row-scroll wl-circles">
          {categories.map((c) => (
            <button
              type="button"
              key={c.name}
              className={'wl-circle' + (activeCategory === c.name ? ' is-active' : '')}
              onClick={() => setActiveCategory((cur) => (cur === c.name ? null : c.name))}
            >
              <span className="wl-circle-img">
                <img src={c.cover} alt="" loading="lazy" />
              </span>
              <span className="wl-circle-name">{c.name}</span>
              <span className="wl-circle-count">{c.count}</span>
            </button>
          ))}
        </div>
      )}

      <div className="wl-toggle">
        <button
          type="button"
          className={'wl-toggle-btn' + (view === 'all' ? ' is-active' : '')}
          onClick={() => setView('all')}
        >
          All items
        </button>
        <button
          type="button"
          className={'wl-toggle-btn' + (view === 'organised' ? ' is-active' : '')}
          onClick={() => setView('organised')}
        >
          Organised
        </button>
      </div>

      {stalePrompt && (
        <div className="wl-prompt">
          <div className="wl-prompt-top">
            <img src={stalePrompt.product.image} alt="" />
            <div>
              <strong>What did you save this for?</strong>
              <span>
                {stalePrompt.product.brand} — saved {daysAgo(stalePrompt.entry.savedDate)} days ago
              </span>
            </div>
            <button
              type="button"
              className="wl-prompt-x"
              onClick={() => setPromptDismissed(true)}
              aria-label="Dismiss"
            >
              {'✕'}
            </button>
          </div>
          <div className="wl-prompt-chips">
            {PICKER_OPTIONS.map((o) => (
              <button
                type="button"
                key={o}
                className="chip"
                onClick={() => {
                  dispatch({ type: 'wish/occasion', id: stalePrompt.product.id, tag: o })
                  toast('Tagged as ' + o)
                  setPromptDismissed(true)
                }}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="wl-none">Nothing saved in {activeCategory}.</p>
      ) : view === 'all' ? (
        <div className="grid">
          {filtered.map(({ entry, product }) => (
            <WishCard
              key={product.id}
              entry={entry}
              product={product}
              /* narrowing to one category is a comparison, so the scores earn
                 their place; the unfiltered list stays the plain baseline */
              organised={!!activeCategory}
              onOpenConfidence={setSheetProduct}
              onShare={setShareProduct}
              onTag={setTagProduct}
              selectMode={selectMode}
              selected={selectedIds.includes(product.id)}
              onToggleSelect={toggleSelect}
              onLongPress={startSelection}
            />
          ))}
        </div>
      ) : (
        sections.map((section) => (
          <section key={section.name} className="wl-section">
            <div className="section-head">
              <h2>{section.name}</h2>
              <span className="wl-section-count">{section.items.length}</span>
            </div>
            <div className="grid">
              {section.items.map(({ entry, product }) => (
                <WishCard
                  key={product.id}
                  entry={entry}
                  product={product}
                  organised
                  onOpenConfidence={setSheetProduct}
                  onShare={setShareProduct}
                  onTag={setTagProduct}
                  selectMode={selectMode}
                  selected={selectedIds.includes(product.id)}
                  onToggleSelect={toggleSelect}
                  onLongPress={startSelection}
                />
              ))}
            </div>
          </section>
        ))
      )}

      {selectMode && (
        <div className="wl-selbar">
          <button type="button" className="wl-selbar-cancel" onClick={() => setSelection(null)}>
            Cancel
          </button>
          <button
            type="button"
            className="btn ghost"
            disabled={!selectedIds.length}
            onClick={removeSelected}
          >
            Remove ({selectedIds.length})
          </button>
          <button
            type="button"
            className="btn solid"
            disabled={!selectedIds.length}
            onClick={moveSelectedToBag}
          >
            Move to Bag ({selectedIds.length})
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
      {shareProduct && (
        <ShareSheet product={shareProduct} onClose={() => setShareProduct(null)} />
      )}
      {tagProduct && (
        <OccasionSheet
          product={tagProduct}
          entry={available.find((x) => x.product.id === tagProduct.id)?.entry}
          onClose={() => setTagProduct(null)}
        />
      )}
    </div>
  )
}
