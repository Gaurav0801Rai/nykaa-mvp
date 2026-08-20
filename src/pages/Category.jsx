import { useMemo, useState } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { getGender, getCategory } from '../data/catalog'
import ProductCard from '../components/ProductCard'
import './category.css'

const SORTS = [
  { key: 'popular', label: 'Popular' },
  { key: 'low', label: 'Price: Low' },
  { key: 'high', label: 'Price: High' },
  { key: 'discount', label: 'Discount' },
]

export default function Category() {
  const { genderSlug, catSlug } = useParams()
  const [sort, setSort] = useState('popular')

  const gender = getGender(genderSlug)
  if (!gender) return <Navigate to="/" replace />

  const category = catSlug ? getCategory(genderSlug, catSlug) : null
  if (catSlug && !category) return <Navigate to={'/c/' + genderSlug} replace />

  const items = useMemo(() => {
    const base = category
      ? category.products
      : gender.subcats.flatMap((s) => s.products)
    const copy = [...base]
    if (sort === 'low') copy.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price))
    if (sort === 'high') copy.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price))
    if (sort === 'discount') copy.sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0))
    return copy
  }, [category, gender, sort])

  return (
    <div className="cat">
      <div className="cat-head">
        <h1>{category ? category.name : gender.name}</h1>
        <p>{items.length} products</p>
      </div>

      {/* subcategory chips — the category grid entry points */}
      <div className="row-scroll chips">
        <Link
          to={'/c/' + gender.slug}
          className={'chip' + (!catSlug ? ' is-active' : '')}
        >
          All
        </Link>
        {gender.subcats.map((s) => (
          <Link
            key={s.slug}
            to={`/c/${gender.slug}/${s.slug}`}
            className={'chip' + (catSlug === s.slug ? ' is-active' : '')}
          >
            {s.name}
          </Link>
        ))}
      </div>

      <div className="sortbar">
        {SORTS.map((s) => (
          <button
            key={s.key}
            className={'sort' + (sort === s.key ? ' is-active' : '')}
            onClick={() => setSort(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid">
        {items.map((p, i) => (
          <ProductCard key={p.id + '-' + i} product={p} />
        ))}
      </div>
    </div>
  )
}
