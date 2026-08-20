import { createPortal } from 'react-dom'
import { useStore } from '../state/store'
import { sheetHost } from './sheetHost'
import './toast.css'

export default function Toast() {
  const { state, dispatch } = useStore()
  const host = sheetHost()

  if (!host || !state.toast) return null

  return createPortal(
    <div className="toast" role="status" key={state.toast.id}>
      <span>{state.toast.text}</span>
      {state.toast.undo && state.undo && (
        <button type="button" onClick={() => dispatch({ type: 'wish/undo' })}>
          Undo
        </button>
      )}
    </div>,
    host
  )
}
