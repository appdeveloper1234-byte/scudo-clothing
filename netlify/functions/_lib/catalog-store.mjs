import { getStore } from '@netlify/blobs'
import { products as seedProducts } from '../../../src/productCatalog.js'
import { HttpError } from './http.mjs'

const CATALOG_STORE = 'scudo-catalog'
const PRODUCT_PREFIX = 'products/'
const allowedImage = (value) => value.startsWith('/') || /^https:\/\//i.test(value)
const clean = (value, maxLength = 160) => String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, maxLength)
const slugify = (value) => clean(value, 100).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)

function stringList(value, maxItems = 20, maxLength = 50) {
  const values = Array.isArray(value) ? value : String(value || '').split(',')
  return [...new Set(values.map((item) => clean(item, maxLength)).filter(Boolean))].slice(0, maxItems)
}

function integer(value, field, { min = 0, max = 10000000, optional = false } = {}) {
  if (optional && (value === '' || value == null || Number(value) === 0)) return null
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) throw new HttpError(400, 'INVALID_PRODUCT', `${field} is invalid.`)
  return parsed
}

export function normalizeCatalogProduct(input, existing = null) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpError(400, 'INVALID_PRODUCT', 'Product details are required.')
  const name = clean(input.name, 100)
  if (name.length < 2) throw new HttpError(400, 'INVALID_PRODUCT', 'Enter a product name.')
  const id = slugify(input.id || existing?.id || input.slug || name)
  const slug = slugify(input.slug || existing?.slug || name)
  if (id.length < 2 || slug.length < 2) throw new HttpError(400, 'INVALID_PRODUCT', 'Enter a valid product name and URL slug.')
  const category = clean(input.category, 50)
  const description = clean(input.description, 2000)
  if (category.length < 2) throw new HttpError(400, 'INVALID_PRODUCT', 'Choose a category such as Jerseys, Shirts, T-Shirts, or Jeans.')
  if (description.length < 10) throw new HttpError(400, 'INVALID_PRODUCT', 'Enter a product description of at least 10 characters.')
  const sizes = stringList(input.sizes)
  const colors = stringList(input.colors)
  const images = stringList(input.images, 8, 500).filter(allowedImage)
  if (!sizes.length) throw new HttpError(400, 'INVALID_PRODUCT', 'Add at least one size.')
  if (!colors.length) throw new HttpError(400, 'INVALID_PRODUCT', 'Add at least one colour.')
  if (!images.length) throw new HttpError(400, 'INVALID_PRODUCT', 'Upload at least one product photo.')
  const price = integer(input.price, 'Regular price', { min: 1 })
  const salePrice = integer(input.salePrice, 'Discounted price', { min: 1, optional: true })
  if (salePrice && salePrice >= price) throw new HttpError(400, 'INVALID_PRODUCT', 'Discounted price must be lower than the regular price.')
  const inventory = integer(input.inventory, 'Inventory', { min: 0, max: 100000 })
  const now = new Date().toISOString()

  return {
    id,
    slug,
    name,
    sku: clean(input.sku, 40).toUpperCase() || `SC-${id.slice(0, 16).toUpperCase()}`,
    category,
    collection: clean(input.collection, 80) || category,
    description,
    shortDescription: clean(input.shortDescription, 240) || description.slice(0, 160),
    price,
    salePrice,
    currency: 'INR',
    brand: 'Scudo Clothing',
    sizes,
    colors,
    inventory,
    images,
    shopImage: images[0],
    material: clean(input.material, 180) || 'Premium everyday fabric',
    careInstructions: clean(input.careInstructions, 240) || 'Cold wash inside out. Air dry in shade.',
    edits: stringList(input.edits, 12, 50).map(slugify).filter(Boolean),
    isNew: input.isNew === true,
    isFeatured: input.isFeatured === true,
    isSoldOut: input.isSoldOut === true || inventory === 0,
    visible: input.visible !== false,
    status: input.status === 'archived' ? 'archived' : 'active',
    source: existing?.source || input.source || 'custom',
    createdAt: existing?.createdAt || input.createdAt || now,
    updatedAt: now,
    updatedBy: clean(input.updatedBy || existing?.updatedBy, 160)
  }
}

function seedProduct(product) {
  return {
    ...product,
    salePrice: product.salePrice || null,
    visible: true,
    status: 'active',
    source: 'seed',
    createdAt: null,
    updatedAt: null,
    updatedBy: ''
  }
}

export async function listCatalogProducts({ includeArchived = false } = {}) {
  const store = getStore(CATALOG_STORE)
  const merged = new Map(seedProducts.map((product) => [product.id, seedProduct(product)]))
  const { blobs } = await store.list({ prefix: PRODUCT_PREFIX })
  const records = await Promise.all(blobs.map(({ key }) => store.get(key, { type: 'json', consistency: 'strong' })))
  for (const record of records.filter(Boolean)) {
    const base = merged.get(record.id)
    merged.set(record.id, { ...base, ...record })
  }
  return [...merged.values()]
    .filter((product) => includeArchived || (product.status !== 'archived' && product.visible !== false))
    .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')) || a.name.localeCompare(b.name))
}

export async function saveCatalogProduct(input, admin, { create = false } = {}) {
  const store = getStore(CATALOG_STORE)
  const catalog = await listCatalogProducts({ includeArchived: true })
  const requestedId = slugify(input.id || input.slug || input.name)
  const existing = catalog.find((product) => product.id === requestedId) || null
  if (create && existing) throw new HttpError(409, 'PRODUCT_EXISTS', 'A product with this name or URL already exists. Select it from the catalog to edit it.')
  if (!create && !existing) throw new HttpError(404, 'PRODUCT_NOT_FOUND', 'This product could not be found. Add it as a new product instead.')
  const product = normalizeCatalogProduct({ ...input, source: existing?.source || 'custom', updatedBy: admin.email }, existing)
  const duplicate = catalog.find((item) => item.id !== product.id && (item.slug === product.slug || item.sku.toLowerCase() === product.sku.toLowerCase()))
  if (duplicate) throw new HttpError(409, 'PRODUCT_EXISTS', 'Another product already uses this SKU or URL slug.')
  await store.setJSON(`${PRODUCT_PREFIX}${product.id}`, product)
  return product
}

export async function archiveCatalogProduct(id, admin) {
  const catalog = await listCatalogProducts({ includeArchived: true })
  const existing = catalog.find((product) => product.id === slugify(id))
  if (!existing) throw new HttpError(404, 'PRODUCT_NOT_FOUND', 'This product could not be found.')
  const record = {
    ...existing,
    visible: false,
    status: 'archived',
    updatedAt: new Date().toISOString(),
    updatedBy: admin.email
  }
  await getStore(CATALOG_STORE).setJSON(`${PRODUCT_PREFIX}${record.id}`, record)
  return record
}

export const catalogStore = () => getStore(CATALOG_STORE)

export function publicCatalogProduct(product) {
  const { updatedBy, ...safeProduct } = product
  return safeProduct
}
