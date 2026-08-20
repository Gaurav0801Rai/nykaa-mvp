import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import './overlay.css'

// Galaxy S20 Ultra: 412 x 915 CSS px, plus an 11px bezel on each side.
const DEVICE_W = 434
const DEVICE_H = 937

const clock = () =>
  new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: false })

// The app always runs inside the device shell — on a laptop and on a real
// phone alike. On a phone the shell fills the screen with a thin black
// surround; on a desktop it sits centred on black.
export default function PhoneFrame({ children }) {
  const scrollRef = useRef(null)
  const { pathname } = useLocation()
  const [time, setTime] = useState(clock)

  // The device always lays out at a true 412 x 915 viewport and is scaled to
  // fit the window. Sizing the frame in CSS instead would shrink the viewport
  // the app measures against and reflow every screen.
  const [scale, setScale] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTime(clock()), 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const fit = () => {
      // a phone gets a thin surround so the device fills the screen; a desktop
      // gets a little more room to read as a device sitting on a background
      const inset = window.innerWidth < 900 ? 8 : 24
      setScale(
        Math.min(
          1,
          (window.innerHeight - inset) / DEVICE_H,
          (window.innerWidth - inset) / DEVICE_W
        )
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

  // scale is 0 only on the very first paint, before the measure runs
  const framed = scale > 0

  // The wrapper carries the SCALED size, so it is an ordinary in-bounds box.
  // Centring the 937px device itself inside a shorter viewport does not work:
  // browsers clamp overflowing centre-alignment back to the start edge, which
  // pushes the device off the bottom of the screen.
  const fitStyle = framed
    ? { width: Math.round(DEVICE_W * scale), height: Math.round(DEVICE_H * scale) }
    : undefined

  return (
    <div className="stage">
      <div className="stage-inner">
        <div className="phone-fit" style={fitStyle}>
          <div
            className="phone-shell"
            style={framed ? { '--phone-scale': scale } : undefined}
          >
            <div className="phone">
              {/* device chrome, not app UI — keeps the punch-hole off content */}
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
                    <rect
                      x=".6"
                      y="1.4"
                      width="18"
                      height="9.2"
                      rx="2.4"
                      fill="none"
                      strokeWidth="1.3"
                      stroke="currentColor"
                    />
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
    </div>
  )
}
