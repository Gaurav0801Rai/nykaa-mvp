import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

// On mobile this is a plain passthrough. On desktop (>=900px) the CSS turns
// .phone-shell into a device cutout with the mobile viewport scrolling inside.
export default function PhoneFrame({ children }) {
  const scrollRef = useRef(null)
  const { pathname } = useLocation()

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="stage">
      <div className="stage-inner">
        <div className="stage-copy">
          <span className="stage-badge">Mockup</span>
          <h1>Nykaa Fashion — mobile</h1>
          <p>
            A mobile-first prototype rendered from a local product catalogue.
            Resize below 900px to view it full-bleed.
          </p>
          <p>2,106 products · 36 categories · 4 departments.</p>
        </div>

        <div className="phone-shell">
          <div className="phone">
            <div className="phone-notch" />
            <div className="scroll" ref={scrollRef}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
