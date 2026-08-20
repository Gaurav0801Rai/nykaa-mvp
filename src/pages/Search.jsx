import { useSearchParams } from 'react-router-dom'
import { searchProducts, catalog } from '../data/catalog'
import ProductCard from '../components/ProductCard'

const SUGGESTIONS = ['Dress', 'Kurta', 'Shirt', 'Saree', 'Sneakers', 'Jewellery', 'Bags']

export default function Search() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const results = searchProducts(q)

  return (
    <div>
      <div className="cat-head">
        <h1>Search</h1>
        <p>{q ? `${results.length} results for “${q}”` : 'Find products across the catalogue'}</p>
      </div>

      {!q && (
        <div className="row-scroll chips" style={{ paddingTop: 4 }}>
          {SUGGESTIONS.map((s) => (
            <button key={s} className="chip" onClick={() => setParams({ q: s })}>
              {s}
            </button>
          ))}
        </div>
      )}

      {q && results.length === 0 && (
        <p style={{ padding: '24px 14px', fontSize: 13, color: 'var(--muted)' }}>
          No products matched “{q}”. Try a brand or category name.
        </p>
      )}

      <div className="grid">
        {results.map((p, i) => (
          <ProductCard key={p.id + '-' + i} product={p} />
        ))}
      </div>
    </div>
  )
}
