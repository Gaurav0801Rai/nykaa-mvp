import { NavLink } from 'react-router-dom'
import './tabbar.css'

const TABS = [
  { to: '/', label: 'Home', icon: '⌂', end: true },
  { to: '/categories', label: 'Categories', icon: '☰' },
  { to: '/search', label: 'Search', icon: '⌕' },
  { to: '/wishlist', label: 'Wishlist', icon: '♡' },
  { to: '/account', label: 'Account', icon: '☺' },
]

export default function TabBar() {
  return (
    <nav className="tabbar">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) => 'tab' + (isActive ? ' is-active' : '')}
        >
          <span className="tab-ico">{t.icon}</span>
          <span className="tab-label">{t.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
