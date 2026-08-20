import { Link, NavLink, useNavigate } from 'react-router-dom'
import { catalog } from '../data/catalog'
import { useStore } from '../state/store'
import './header.css'

export default function Header({ query, onQuery }) {
  const navigate = useNavigate()
  const { bagCount } = useStore()

  const submit = (e) => {
    e.preventDefault()
    if (query?.trim()) navigate('/search?q=' + encodeURIComponent(query.trim()))
  }

  return (
    <header className="hdr">
      <div className="hdr-top">
        <Link to="/" className="logo">
          <span className="logo-mark">NYKAA</span>
          <span className="logo-sub">FASHION</span>
        </Link>
        <div className="hdr-icons">
          <Link to="/wishlist" aria-label="Wishlist" className="icon-btn">♡</Link>
          <Link to="/bag" aria-label="Bag" className="icon-btn">
            ⛶<span className="bag-dot">{bagCount}</span>
          </Link>
        </div>
      </div>

      <form className="search" onSubmit={submit}>
        <span className="search-ico">⌕</span>
        <input
          value={query ?? ''}
          onChange={(e) => onQuery?.(e.target.value)}
          placeholder="Search for products, styles, brands"
        />
      </form>

      <nav className="gender-tabs">
        {catalog.map((g) => (
          <NavLink
            key={g.slug}
            to={'/c/' + g.slug}
            className={({ isActive }) => 'gender-tab' + (isActive ? ' is-active' : '')}
          >
            {g.name}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
