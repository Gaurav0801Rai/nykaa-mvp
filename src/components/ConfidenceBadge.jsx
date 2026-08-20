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

// The reason is mandatory — a bare number is not decision support, so the
// badge is never rendered without it. Two lines: why to buy, then the
// evidence. `text` overrides only the first line, which is what the LLM writes.
export function ConfidenceReason({ product, text }) {
  const { why, evidence } = confidence(product)
  return (
    <>
      <p className="creason">{text || why}</p>
      <p className="creason-sub">{evidence}</p>
    </>
  )
}
