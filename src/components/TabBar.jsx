import { NavLink } from 'react-router-dom'
import { useStore } from '../state/store'
import { HeartIcon } from './icons'
import './tabbar.css'

const TABS = [
  { to: '/', label: 'Home', icon: '⌂', end: true },
  { to: '/categories', label: 'Categories', icon: '☰' },
  { to: '/search', label: 'Search', icon: '⌕' },
  { to: '/wishlist', label: 'Wishlist', icon: null },
  { to: '/account', label: 'Account', icon: '☺' },
]

export default function TabBar() {
  const { entries } = useStore()

  return (
    <nav className="tabbar">
      {TABS.map((t) => {
        const isWishlist = t.to === '/wishlist'
        return (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              'tab' + (isActive ? ' is-active' : '') + (isWishlist ? ' tab--wishlist' : '')
            }
          >
            <span className="tab-ico">
              {isWishlist ? <HeartIcon /> : t.icon}
              {/* the saved count draws the eye to the screen this build is about */}
              {isWishlist && entries.length > 0 && (
                <span className="tab-dot">{entries.length}</span>
              )}
            </span>
            <span className="tab-label">{t.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
