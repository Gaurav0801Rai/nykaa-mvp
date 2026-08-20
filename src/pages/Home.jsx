import { Link } from 'react-router-dom'
import { catalog, pick, formatINR } from '../data/catalog'
import ProductCard from '../components/ProductCard'
import './home.css'

// A flat rail of every subcategory across departments, for the circular rail.
const railItems = catalog.flatMap((g) =>
  g.subcats.map((s) => ({ ...s, gender: g.name, genderSlug: g.slug }))
)

export default function Home() {
  const women = catalog.find((g) => g.name === 'Women')
  const men = catalog.find((g) => g.name === 'Men')

  const trending = pick(
    women ? women.subcats.flatMap((s) => s.products) : [],
    12,
    3
  )
  const menPicks = pick(men ? men.subcats.flatMap((s) => s.products) : [], 12, 11)

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-inner">
          <span className="hero-kicker">END OF SEASON</span>
          <h1>
            UPTO <em>75%</em> OFF
          </h1>
          <p>On 2,000+ styles across fashion, beauty & home</p>
          <Link to="/c/women" className="hero-cta">
            Shop now
          </Link>
        </div>
      </section>

      <section className="rail">
        <div className="row-scroll">
          {pick(railItems, 12, 1).map((c, i) => (
            <Link
              key={c.genderSlug + c.slug + i}
              to={`/c/${c.genderSlug}/${c.slug}`}
              className="rail-item"
            >
              <div className="rail-img">
                {c.cover && <img src={c.cover} alt={c.name} loading="lazy" />}
              </div>
              <span>{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {catalog.map((g) => (
        <section key={g.slug} className="dept">
          <div className="section-head">
            <h2>Shop {g.name}</h2>
            <Link to={'/c/' + g.slug}>View all</Link>
          </div>
          <div className="dept-grid">
            {g.subcats.slice(0, 6).map((s) => (
              <Link key={s.slug} to={`/c/${g.slug}/${s.slug}`} className="dept-tile">
                <div className="dept-img">
                  {s.cover && <img src={s.cover} alt={s.name} loading="lazy" />}
                </div>
                <div className="dept-meta">
                  <strong>{s.name}</strong>
                  <span>{s.count} items</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section>
        <div className="section-head">
          <h2>Trending for Women</h2>
          <Link to="/c/women">View all</Link>
        </div>
        <div className="row-scroll">
          {trending.map((p, i) => (
            <ProductCard key={p.id + '-' + i} product={p} compact />
          ))}
        </div>
      </section>

      <section>
        <div className="section-head">
          <h2>Picks for Men</h2>
          <Link to="/c/men">View all</Link>
        </div>
        <div className="row-scroll">
          {menPicks.map((p, i) => (
            <ProductCard key={p.id + '-' + i} product={p} compact />
          ))}
        </div>
      </section>

      <footer className="foot">
        <p>Nykaa Fashion — local mockup</p>
        <span>Static prototype · no live checkout</span>
      </footer>
    </div>
  )
}
