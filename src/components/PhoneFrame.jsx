import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import './overlay.css'

const clock = () =>
  new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: false })

// On mobile this is a plain passthrough. On desktop (>=900px) the CSS turns
// .phone-shell into a Galaxy S20 Ultra cutout with the mobile viewport
// scrolling inside it.
export default function PhoneFrame({ children }) {
  const scrollRef = useRef(null)
  const { pathname } = useLocation()
  const [time, setTime] = useState(clock)

  // The device renders at a true 412 x 915 CSS viewport — the real S20 Ultra
  // size — and is then scaled down to fit the window. Scaling the frame with
  // CSS sizing instead would shrink the app's viewport and reflow the layout.
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const id = setInterval(() => setTime(clock()), 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const fit = () => {
      if (window.innerWidth < 900) return setScale(1)
      return setScale(
        Math.min(1, (window.innerHeight - 24) / 937, (window.innerWidth - 24) / 434)
      )
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="stage">
      <div className="stage-inner">
        <div className="phone-shell" style={{ '--phone-scale': scale }}>
          <div className="phone">
            {/* device chrome, not app UI — keeps the punch-hole clear of content */}
            <div className="phone-status">
              <span className="phone-time">{time}</span>
              <span className="phone-camera" />
              <span className="phone-glyphs">
                <svg viewBox="0 0 16 12" aria-hidden="true">
                  <path d="M8 10.5 1 4.2A10 10 0 0 1 15 4.2Z" opacity=".9" />
                </svg>
                <svg viewBox="0 0 16 12" aria-hidden="true">
                  <rect x="0" y="8" width="3" height="4" rx=".5" />
                  <rect x="4.3" y="6" width="3" height="6" rx=".5" />
                  <rect x="8.6" y="3.5" width="3" height="8.5" rx=".5" />
                  <rect x="12.9" y="1" width="3" height="11" rx=".5" opacity=".35" />
                </svg>
                <svg viewBox="0 0 22 12" aria-hidden="true">
                  <rect x=".6" y="1.4" width="18" height="9.2" rx="2.4" fill="none" strokeWidth="1.3" stroke="currentColor" />
                  <rect x="2.4" y="3.2" width="12" height="5.6" rx="1.2" />
                  <rect x="20" y="4.4" width="1.6" height="3.2" rx=".8" />
                </svg>
              </span>
            </div>
            <div className="scroll" ref={scrollRef}>
              {children}
            </div>
            {/* sheets and toasts portal in here so they stay inside the phone */}
            <div className="sheet-root" />
          </div>
        </div>
      </div>
    </div>
  )
}
