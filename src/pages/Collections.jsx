import { useMemo, useState } from 'react'
import { useStore } from '../state/store'
import { OCCASIONS, PICKER_OPTIONS, occasionLabel } from '../lib/occasion'
import ScreenHeader from '../components/ScreenHeader'
import ProductCard from '../components/ProductCard'
import './collections.css'

const UNTAGGED = 'Not tagged yet'

export default function Collections() {
  const { available, dispatch, toast } = useStore()

  const [grouping, setGrouping] = useState('occasion')
  const [collapsed, setCollapsed] = useState({})
  const [picking, setPicking] = useState(null)

  const sections = useMemo(() => {
    if (grouping === 'category') {
      const map = new Map()
      for (const x of available) {
        if (!map.has(x.product.category)) map.set(x.product.category, [])
        map.get(x.product.category).push(x)
      }
      return [...map.entries()]
        .map(([name, items]) => ({ name, items }))
        .sort((a, b) => b.items.length - a.items.length)
    }

    // Occasion grouping keeps a fixed order, and "Not tagged yet" is kept on
    // purpose — it holds what could not be confidently inferred.
    const buckets = new Map()
    for (const name of OCCASIONS) buckets.set(name, [])
    for (const x of available) {
      const key = x.entry.occasionTag || UNTAGGED
      if (!buckets.has(key)) buckets.set(key, [])
      buckets.get(key).push(x)
    }
    if (!buckets.has(UNTAGGED)) buckets.set(UNTAGGED, [])

    return [...buckets.entries()]
      .filter(([name, items]) => items.length > 0 || OCCASIONS.includes(name) || name === UNTAGGED)
      .map(([name, items]) => ({ name, items }))
  }, [available, grouping])

  const setOccasion = (id, tag) => {
    dispatch({ type: 'wish/occasion', id, tag })
    toast('Moved to ' + tag)
    setPicking(null)
  }

  return (
    <div className="col">
      <ScreenHeader title="Collections" subtitle={available.length + ' saved items'} />

      <div className="wl-toggle">
        <button
          type="button"
          className={'wl-toggle-btn' + (grouping === 'category' ? ' is-active' : '')}
          onClick={() => setGrouping('category')}
        >
          Category
        </button>
        <button
          type="button"
          className={'wl-toggle-btn' + (grouping === 'occasion' ? ' is-active' : '')}
          onClick={() => setGrouping('occasion')}
        >
          Occasion
        </button>
      </div>

      {sections.map((section) => {
        const isOpen = !collapsed[section.name]
        return (
          <section key={section.name} className="col-section">
            <button
              type="button"
              className="col-head"
              onClick={() =>
                setCollapsed((c) => ({ ...c, [section.name]: !c[section.name] }))
              }
              aria-expanded={isOpen}
            >
              <span className="col-head-name">{section.name}</span>
              <span className="col-head-count">{section.items.length}</span>
              <span className={'col-head-caret' + (isOpen ? ' is-open' : '')}>{'⌄'}</span>
            </button>

            {isOpen &&
              (section.items.length === 0 ? (
                <p className="col-empty">Nothing here yet.</p>
              ) : (
                <div className="grid">
                  {section.items.map(({ entry, product }) => (
                    <div className="col-item" key={product.id}>
                      <ProductCard product={product} />
                      <button
                        type="button"
                        className="col-occ"
                        onClick={() => setPicking(picking === product.id ? null : product.id)}
                        aria-expanded={picking === product.id}
                      >
                        {occasionLabel(entry.occasionTag)}
                      </button>
                      {picking === product.id && (
                        <div className="col-picker">
                          {PICKER_OPTIONS.map((o) => (
                            <button
                              type="button"
                              key={o}
                              className={'chip' + (entry.occasionTag === o ? ' is-active' : '')}
                              onClick={() => setOccasion(product.id, o)}
                            >
                              {o}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
          </section>
        )
      })}
    </div>
  )
}
