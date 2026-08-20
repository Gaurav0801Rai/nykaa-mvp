import { useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import PhoneFrame from './components/PhoneFrame'
import Header from './components/Header'
import TabBar from './components/TabBar'
import Toast from './components/Toast'
import Home from './pages/Home'
import Category from './pages/Category'
import Product from './pages/Product'
import Categories from './pages/Categories'
import Search from './pages/Search'
import Wishlist from './pages/Wishlist'
import Collections from './pages/Collections'
import Unavailable from './pages/Unavailable'
import Bag from './pages/Bag'
import { Account } from './pages/Simple'

export default function App() {
  const [query, setQuery] = useState('')
  const { pathname } = useLocation()

  // The PDP is a full-bleed screen — it hides the chrome like the real app.
  const isPdp = pathname.startsWith('/p/')

  // These screens bring their own header. The search bar and the
  // Women / Men / Kids / Home strip belong to browsing, not to your saved
  // items or your bag, so they are not rendered here.
  const ownHeader = ['/wishlist', '/collections', '/unavailable', '/bag'].includes(pathname)

  return (
    <PhoneFrame>
      {!isPdp && !ownHeader && <Header query={query} onQuery={setQuery} />}

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/search" element={<Search />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/unavailable" element={<Unavailable />} />
          <Route path="/bag" element={<Bag />} />
          <Route path="/account" element={<Account />} />
          <Route path="/c/:genderSlug" element={<Category />} />
          <Route path="/c/:genderSlug/:catSlug" element={<Category />} />
          <Route path="/p/:id" element={<Product />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>

      {!isPdp && <TabBar />}

      <Toast />
    </PhoneFrame>
  )
}
