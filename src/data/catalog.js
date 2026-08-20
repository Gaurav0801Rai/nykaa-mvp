import raw from './products.json'

export const GENDERS = ['Women', 'Men', 'Kids', 'Home']

const slugify = (s) =>
  s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// Flatten the scraped {gender: {rootId, subcats:[{name,id,products}]}} shape
// into lookup structures the pages render from.
const build = () => {
  const genders = []
  const allProducts = []

  for (const gender of GENDERS) {
    const node = raw[gender]
    if (!node) continue

    const subcats = node.subcats.map((sc) => {
      const slug = slugify(sc.name)
      const products = sc.products.map((p) => ({
        ...p,
        gender,
        category: sc.name,
        categoryId: sc.id,
        categorySlug: slug,
      }))
      allProducts.push(...products)
      return {
        name: sc.name,
        id: sc.id,
        slug,
        count: products.length,
        cover: products[0]?.image ?? null,
        products,
      }
    })

    genders.push({
      name: gender,
      slug: slugify(gender),
      rootId: node.rootId,
      subcats,
    })
  }

  return { genders, allProducts }
}

const { genders, allProducts } = build()

export const catalog = genders
export const products = allProducts

export const getGender = (slug) => genders.find((g) => g.slug === slug)

export const getCategory = (genderSlug, catSlug) =>
  getGender(genderSlug)?.subcats.find((s) => s.slug === catSlug)

export const getProduct = (id) => allProducts.find((p) => p.id === String(id))

export const relatedProducts = (product, limit = 12) =>
  allProducts
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, limit)

export const searchProducts = (query, limit = 40) => {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return allProducts
    .filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    )
    .slice(0, limit)
}

// Deterministic pick so the mock homepage looks curated, not random.
export const pick = (list, n, offset = 0) => {
  const out = []
  for (let i = 0; i < n && i < list.length; i++) out.push(list[(i * 7 + offset) % list.length])
  return out
}

export const formatINR = (n) => '₹' + Number(n).toLocaleString('en-IN')
