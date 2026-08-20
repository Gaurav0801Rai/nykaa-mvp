import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { getProduct, products as allProducts } from '../data/catalog'
import { buildSeedWishlist } from '../data/seedWishlist'
import { inferOccasion } from '../lib/occasion'
import { preferredSize } from '../lib/sizing'
import { productType } from '../lib/productType'

const KEY = 'nf-state-v1'

const medianPrice = (() => {
  const prices = allProducts.map((p) => p.salePrice ?? p.price).sort((a, b) => a - b)
  return prices[Math.floor(prices.length / 2)]
})()

const initial = () => {
  try {
    const saved = sessionStorage.getItem(KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed.wishlist) && Array.isArray(parsed.bag)) {
        return { ...parsed, toast: null, undo: null }
      }
    }
  } catch {
    // corrupt or unavailable storage — fall through to a fresh seed
  }
  return { wishlist: buildSeedWishlist(), bag: [], toast: null, undo: null }
}

let toastSeq = 0

function reducer(state, action) {
  switch (action.type) {
    case 'wish/add': {
      const { product } = action
      if (state.wishlist.some((e) => e.id === product.id)) return state
      const inferred = inferOccasion(product, { medianPrice })
      const entry = {
        id: product.id,
        savedDate: new Date().toISOString(),
        occasionTag: inferred.tag,
        occasionConfidence: inferred.confidence,
        occasionSource: inferred.tag ? 'inferred' : null,
        notifyMe: false,
        availability: 'in-stock',
      }
      return { ...state, wishlist: [entry, ...state.wishlist] }
    }

    case 'wish/remove': {
      const index = state.wishlist.findIndex((e) => e.id === action.id)
      if (index < 0) return state
      return {
        ...state,
        wishlist: state.wishlist.filter((e) => e.id !== action.id),
        undo: { entry: state.wishlist[index], index },
      }
    }

    case 'wish/removeMany': {
      const ids = new Set(action.ids)
      return { ...state, wishlist: state.wishlist.filter((e) => !ids.has(e.id)), undo: null }
    }

    case 'wish/undo': {
      if (!state.undo) return state
      const next = [...state.wishlist]
      next.splice(Math.min(state.undo.index, next.length), 0, state.undo.entry)
      return { ...state, wishlist: next, undo: null, toast: null }
    }

    case 'wish/occasion':
      return {
        ...state,
        wishlist: state.wishlist.map((e) =>
          e.id === action.id
            ? { ...e, occasionTag: action.tag, occasionSource: 'user', occasionConfidence: 1 }
            : e
        ),
      }

    case 'wish/notify':
      return {
        ...state,
        wishlist: state.wishlist.map((e) =>
          e.id === action.id ? { ...e, notifyMe: !e.notifyMe } : e
        ),
      }

    // Enrichment written back from the server routes. Cached on the entry so
    // it is computed once per product, never per render.
    case 'wish/enrich':
      return {
        ...state,
        wishlist: state.wishlist.map((e) =>
          e.id === action.id && e.occasionSource !== 'user' ? { ...e, ...action.patch } : e
        ),
      }

    case 'bag/add': {
      const existing = state.bag.find((i) => i.id === action.id)
      const bag = existing
        ? state.bag.map((i) => (i.id === action.id ? { ...i, qty: i.qty + 1 } : i))
        : [...state.bag, { id: action.id, size: action.size ?? null, qty: 1, selected: true }]
      return { ...state, bag }
    }

    case 'bag/addMany': {
      let bag = state.bag
      for (const { id, size } of action.items) {
        const existing = bag.find((i) => i.id === id)
        bag = existing
          ? bag.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i))
          : [...bag, { id, size: size ?? null, qty: 1, selected: true }]
      }
      return { ...state, bag }
    }

    case 'bag/remove':
      return { ...state, bag: state.bag.filter((i) => i.id !== action.id) }

    case 'bag/qty':
      return {
        ...state,
        bag: state.bag.map((i) => (i.id === action.id ? { ...i, qty: Math.max(1, action.qty) } : i)),
      }

    case 'bag/size':
      return {
        ...state,
        bag: state.bag.map((i) => (i.id === action.id ? { ...i, size: action.size } : i)),
      }

    case 'bag/select':
      return {
        ...state,
        bag: state.bag.map((i) => (i.id === action.id ? { ...i, selected: !i.selected } : i)),
      }

    case 'toast/show':
      return { ...state, toast: { id: ++toastSeq, text: action.text, undo: !!action.undo } }

    case 'toast/hide':
      return { ...state, toast: null, undo: null }

    default:
      return state
  }
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initial)
  const timer = useRef(null)

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ wishlist: state.wishlist, bag: state.bag }))
    } catch {
      // storage blocked or full — the session just won't survive a reload
    }
  }, [state.wishlist, state.bag])

  // Toasts auto-dismiss; Undo stays live for the 5 seconds the toast is up.
  useEffect(() => {
    if (!state.toast) return undefined
    clearTimeout(timer.current)
    timer.current = setTimeout(() => dispatch({ type: 'toast/hide' }), 5000)
    return () => clearTimeout(timer.current)
  }, [state.toast])

  const value = useMemo(() => {
    const entries = state.wishlist
      .map((entry) => ({ entry, product: getProduct(entry.id) }))
      .filter((x) => x.product)

    const available = entries.filter((x) => x.entry.availability === 'in-stock')
    const unavailable = entries.filter((x) => x.entry.availability !== 'in-stock')

    const bagLines = state.bag
      .map((item) => ({ item, product: getProduct(item.id) }))
      .filter((x) => x.product)

    // Category circles come from what is actually saved, so an empty category
    // never appears and nothing is ever "Uncategorized".
    const categories = []
    for (const x of available) {
      const name = productType(x.product)
      let c = categories.find((k) => k.name === name)
      if (!c) {
        c = { name, count: 0, cover: x.product.image }
        categories.push(c)
      }
      c.count++
    }
    categories.sort((a, b) => b.count - a.count)

    return {
      state,
      dispatch,
      entries,
      available,
      unavailable,
      bagLines,
      bagCount: state.bag.reduce((n, i) => n + i.qty, 0),
      categories,
      isWished: (id) => state.wishlist.some((e) => e.id === id),
      inBag: (id) => state.bag.some((i) => i.id === id),
      sizeFor: (product) => preferredSize(product, state.bag),
      toast: (text, undo = false) => dispatch({ type: 'toast/show', text, undo }),
    }
  }, [state])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}

export const daysAgo = (iso) =>
  Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 86400000))

export const savedLabel = (iso) => {
  const d = daysAgo(iso)
  if (d === 0) return 'saved today'
  if (d === 1) return 'saved yesterday'
  return 'saved ' + d + ' days ago'
}
