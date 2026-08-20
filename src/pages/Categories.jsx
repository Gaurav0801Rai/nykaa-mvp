import { useState } from 'react'
import { Link } from 'react-router-dom'
import { catalog } from '../data/catalog'
import './categories.css'

export default function Categories() {
  const [active, setActive] = useState(catalog[0]?.slug)
  const gender = catalog.find((g) => g.slug === active) ?? catalog[0]

  return (
    <div className="cats">
      <aside className="cats-rail">
        {catalog.map((g) => (
          <button
            key={g.slug}
            className={'cats-rail-item' + (g.slug === active ? ' is-active' : '')}
            onClick={() => setActive(g.slug)}
          >
            {g.name}
          </button>
        ))}
      </aside>

      <div className="cats-panel">
        <div className="cats-panel-head">
          <h2>{gender.name}</h2>
          <Link to={'/c/' + gender.slug}>View all</Link>
        </div>
        <div className="cats-grid">
          {gender.subcats.map((s) => (
            <Link key={s.slug} to={`/c/${gender.slug}/${s.slug}`} className="cats-tile">
              <div className="cats-img">
                {s.cover && <img src={s.cover} alt={s.name} loading="lazy" />}
              </div>
              <strong>{s.name}</strong>
              <span>{s.count}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
