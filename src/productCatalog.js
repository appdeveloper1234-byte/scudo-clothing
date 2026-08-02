const catalogImages = (slug, count) => Array.from({ length: count }, (_, index) => `/catalog/${slug}/${String(index + 1).padStart(2, '0')}.webp`)

const jerseyDefaults = {
  category: 'Jerseys',
  currency: 'INR',
  brand: 'Scudo Clothing',
  sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  material: 'Breathable performance polyester',
  careInstructions: 'Cold wash inside out. Air dry in shade.',
  isSoldOut: false
}

export const products = [
  {
    ...jerseyDefaults,
    id: 'argentina-champions-home', name: 'Argentina Champions Home Jersey', slug: 'argentina-champions-home-jersey',
    description: 'The iconic sky-blue and white home shirt, finished with the champions badge and gold crest details.',
    shortDescription: 'Champions-edition Argentina home jersey.', collection: 'Master Version', edits: ['new-arrivals', 'master-version'],
    price: 2999, salePrice: 1499, sku: 'SC-ARG-M01', colors: ['Sky blue', 'White'], inventory: 17,
    images: catalogImages('argentina-champions-home', 6), isNew: true, isFeatured: false
  },
  {
    ...jerseyDefaults,
    id: 'brazil-home', name: 'Brazil 2024/25 Home Jersey', slug: 'brazil-2024-25-home-jersey',
    description: 'A vivid yellow Brazil home shirt with green trim, a clean V-neck construction, and a lightweight match-ready feel.',
    shortDescription: 'Brazil yellow home jersey with green trim.', collection: 'Master Version', edits: ['bestsellers', 'master-version'],
    price: 2299, salePrice: 1399, sku: 'SC-BRA-M02', colors: ['Yellow', 'Green'], inventory: 24,
    images: catalogImages('brazil-home', 7), isNew: false, isFeatured: true
  },
  {
    ...jerseyDefaults,
    id: 'brazil-blue-away', name: 'Brazil Blue Away Football Kit', slug: 'brazil-blue-away-football-kit',
    description: 'A deep navy Brazil away shirt with electric blue movement, gold details, and a bold modern graphic.',
    shortDescription: 'Brazil navy away kit with electric blue pattern.', collection: 'Master Version', edits: ['master-version', 'affordable-kits'],
    price: 1999, salePrice: 1299, sku: 'SC-BRA-A03', colors: ['Navy', 'Royal blue'], inventory: 21,
    images: catalogImages('brazil-blue-away', 7), isNew: false, isFeatured: false
  },
  {
    ...jerseyDefaults,
    id: 'barcelona-player-home', name: 'FC Barcelona Home Player Jersey', slug: 'fc-barcelona-home-player-jersey',
    description: 'A player-cut Barcelona home shirt with engineered red and navy graphics and a close, athletic silhouette.',
    shortDescription: 'Barcelona home jersey in player construction.', collection: 'Master Version', edits: ['new-arrivals', 'master-version'],
    price: 2799, salePrice: 1499, sku: 'SC-FCB-M04', colors: ['Navy', 'Crimson'], inventory: 13,
    images: catalogImages('barcelona-player-home', 6), material: 'Engineered performance mesh', isNew: true, isFeatured: false
  },
  {
    ...jerseyDefaults,
    id: 'france-away', name: 'France 2024 Away Jersey', slug: 'france-2024-away-jersey',
    description: 'A pale mint France away jersey with orange crest accents and a quiet, fashion-forward colour story.',
    shortDescription: 'France away jersey in pale mint.', collection: 'Master Version', edits: ['new-arrivals', 'master-version'],
    price: 2399, salePrice: 1399, sku: 'SC-FRA-A05', colors: ['Mint', 'White'], inventory: 16,
    images: catalogImages('france-away', 5), isNew: true, isFeatured: false
  },
  {
    ...jerseyDefaults,
    id: 'france-home', name: 'France 2024/25 Home Jersey', slug: 'france-2024-25-home-jersey',
    description: 'A deep blue France home jersey with a crisp white collar, gold marks, and tonal diagonal texture.',
    shortDescription: 'France blue home jersey with white collar.', collection: 'Master Version', edits: ['bestsellers', 'master-version'],
    price: 2499, salePrice: null, sku: 'SC-FRA-H06', colors: ['Blue', 'White'], inventory: 20,
    images: catalogImages('france-home', 7), isNew: false, isFeatured: true
  },
  {
    ...jerseyDefaults,
    id: 'portugal-away', name: 'Portugal 2026 Away Player Jersey', slug: 'portugal-2026-away-player-jersey',
    description: 'A fresh mint-and-white Portugal away shirt with expressive brushwork and an athletic player-version fit.',
    shortDescription: 'Portugal mint away jersey in player fit.', collection: 'Player Version', edits: ['bestsellers', 'player-version'],
    price: 2999, salePrice: 1499, sku: 'SC-POR-A07', colors: ['Mint', 'White'], inventory: 12,
    images: catalogImages('portugal-away', 5), material: 'Ultra-light performance mesh', isNew: false, isFeatured: true
  },
  {
    ...jerseyDefaults,
    id: 'portugal-black-special', name: 'Portugal Black Special Edition Jersey', slug: 'portugal-black-special-edition-jersey',
    description: 'A black-on-black Portugal special edition finished with antique gold marks and precise red-green trim.',
    shortDescription: 'Portugal black anniversary special edition.', collection: 'Master Version', edits: ['master-version'],
    price: 2899, salePrice: 1299, sku: 'SC-POR-B08', colors: ['Black', 'Gold'], inventory: 9,
    images: catalogImages('portugal-black-special', 6), material: 'Jacquard performance polyester', isNew: false, isFeatured: true
  },
  {
    ...jerseyDefaults,
    id: 'portugal-home-kit', name: 'Portugal Home Jersey Kit', slug: 'portugal-home-jersey-kit',
    description: 'A confident red Portugal home shirt with green edging and subtle tonal waves across the body.',
    shortDescription: 'Portugal red home kit with green trim.', collection: 'Master Version', edits: ['master-version', 'affordable-kits'],
    price: 1899, salePrice: 1199, sku: 'SC-POR-H09', colors: ['Red', 'Green'], inventory: 27,
    images: catalogImages('portugal-home-kit', 6), isNew: false, isFeatured: false
  },
  {
    ...jerseyDefaults,
    id: 'real-madrid-home', name: 'Real Madrid 2024/25 Home Player Jersey', slug: 'real-madrid-2024-25-home-player-jersey',
    description: 'A clean white Real Madrid home shirt with deep green trim and a streamlined player-version construction.',
    shortDescription: 'Real Madrid white home jersey in player fit.', collection: 'Player Version', edits: ['player-version'],
    price: 1799, salePrice: 1299, sku: 'SC-RMA-H10', colors: ['White', 'Deep green'], inventory: 14,
    images: catalogImages('real-madrid-home', 5), material: 'Authentic performance knit', isNew: false, isFeatured: false
  },
  {
    ...jerseyDefaults,
    id: 'spain-home', name: 'Spain 2024/25 Home Player Jersey', slug: 'spain-2024-25-home-player-jersey',
    description: 'A saturated red Spain home shirt with navy sleeves, gold pinstripes, and a lightweight athletic shape.',
    shortDescription: 'Spain red home jersey with navy sleeves.', collection: 'Player Version', edits: ['player-version'],
    price: 2199, salePrice: 1499, sku: 'SC-ESP-H11', colors: ['Red', 'Navy'], inventory: 18,
    images: catalogImages('spain-home', 5), material: 'Lightweight performance mesh', isNew: false, isFeatured: false
  }
]
