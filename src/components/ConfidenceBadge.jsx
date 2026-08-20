import { confidence, scoreBand } from '../lib/confidence'
import './confidence.css'

// The circular Confidence Score. It measures how well validated an item is by
// other buyers — never an authenticity or trust score.
export default function ConfidenceBadge({ product, onOpen, size = 'md' }) {
  const { score } = confidence(product)

  return (
    <button
      type="button"
      className={'cbadge cbadge--' + size + ' is-' + scoreBand(score)}
      style={{ '--pct': score }}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onOpen?.(product)
      }}
      aria-label={'Confidence Score ' + score + ' of 100. Open breakdown.'}
    >
      <span className="cbadge-ring">
        <span className="cbadge-num">{score}</span>
      </span>
    </button>
  )
}

// The reason line is mandatory — a bare number is not decision support, so the
// badge is never rendered without one.
export function ConfidenceReason({ product, text }) {
  return <p className="creason">{text || confidence(product).reason}</p>
}
