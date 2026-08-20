// Shared line icons. The header controls used single glyph characters, which
// rendered small and inconsistently across platforms.

export const BagIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path
      d="M4.5 8h15l-1.1 11.2a2 2 0 0 1-2 1.8H7.6a2 2 0 0 1-2-1.8L4.5 8Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="M8.8 10.4V7a3.2 3.2 0 0 1 6.4 0v3.4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
)

export const HeartIcon = ({ filled = false, ...props }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} aria-hidden="true" {...props}>
    <path
      d="M12 20.3s-7.4-4.6-7.4-9.6A4.2 4.2 0 0 1 12 8.1a4.2 4.2 0 0 1 7.4 2.6c0 5-7.4 9.6-7.4 9.6Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
)
