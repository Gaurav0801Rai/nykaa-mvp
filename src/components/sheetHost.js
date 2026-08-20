// Sheets and toasts render into the host PhoneFrame mounts inside .phone, so
// on desktop they stay within the phone cutout instead of the browser window.
export const sheetHost = () =>
  typeof document === 'undefined' ? null : document.querySelector('.sheet-root')
