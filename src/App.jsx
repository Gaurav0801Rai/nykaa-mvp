import { useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import PhoneFrame from './components/PhoneFrame'
import Header from './components/Header'
import TabBar from './components/TabBar'
import Home from './pages/Home'
import Category from './pages/Category'
import Product from './pages/Product'
import Categories from './pages/Categories'
import Search from './pages/Search'
import { Wishlist, Account } from './pages/Simple'

export default function App() {
  const [query, setQuery] = useState('')
  const { pathname } = useLocation()

  // The PDP is a full-bleed screen — it hides the chrome like the real app.
  const isPdp = pathname.startsWith('/p/')

  return (
    <PhoneFrame>
      {!isPdp && <Header query={query} onQuery={setQuery} />}

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/search" element={<Search />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/account" element={<Account />} />
          <Route path="/c/:genderSlug" element={<Category />} />
          <Route path="/c/:genderSlug/:catSlug" element={<Category />} />
          <Route path="/p/:id" element={<Product />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>

      {!isPdp && <TabBar />}
    </PhoneFrame>
  )
}
