import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../state/store'
import { BagIcon } from './icons'
import './screen-header.css'

// Header for the screens that stand on their own. These do not want the global
// search bar or the Women / Men / Kids / Home strip — you are inside your own
// saved items, not browsing departments.
export default function ScreenHeader({ title, subtitle, actions = null, showBag = true }) {
  const navigate = useNavigate()
  const { bagCount } = useStore()

  return (
    <header className="shead">
      <button type="button" className="shead-back" onClick={() => navigate(-1)} aria-label="Go back">
        {'←'}
      </button>

      <div className="shead-titles">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>

      <div className="shead-actions">
        {actions}
        {showBag && (
          <Link to="/bag" className="shead-icon" aria-label="Bag">
            <BagIcon />
            {bagCount > 0 && <span className="shead-dot">{bagCount}</span>}
          </Link>
        )}
      </div>
    </header>
  )
}
