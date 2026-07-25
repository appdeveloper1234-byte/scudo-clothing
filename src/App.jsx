import { useEffect, useId, useMemo, useState } from 'react'

const image = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=82`

export const products = [
  {
    id: 'scudo-noir-crest', name: 'Scudo Noir Crest Jersey', slug: 'scudo-noir-crest-jersey',
    description: 'A considered matchday layer with a relaxed fit, contrast piping, and a soft hand feel that moves easily beyond the pitch.',
    shortDescription: 'Black matchday jersey with sand contrast detail.', category: 'Jerseys', collection: 'Drop 01',
    price: 2490, salePrice: null, currency: 'INR', sku: 'SC-JER-N01', brand: 'Scudo Clothing', colors: ['Noir', 'Sand'], sizes: ['S', 'M', 'L', 'XL'], inventory: 18,
    images: [image('photo-1521572163474-6864f9cf17ab'), image('photo-1551488831-00ddcb6c6bd3')], material: '220 GSM cotton jersey', careInstructions: 'Cold wash inside out. Do not tumble dry.', isNew: true, isFeatured: true, isSoldOut: false,
    seoTitle: 'Scudo Noir Crest Jersey', seoDescription: 'The first Scudo Clothing matchday jersey in Noir.'
  },
  {
    id: 'mint-motion', name: 'Scudo Mint Motion Jersey', slug: 'scudo-mint-motion-jersey',
    description: 'A cool-toned jersey cut for warm evenings and late kick-offs. Clean lines, dropped shoulders, and room where it counts.',
    shortDescription: 'Mint green jersey with an easy everyday fit.', category: 'Jerseys', collection: 'Motion Study',
    price: 2690, salePrice: null, currency: 'INR', sku: 'SC-JER-M02', brand: 'Scudo Clothing', colors: ['Mint', 'Off-white'], sizes: ['S', 'M', 'L', 'XL'], inventory: 11,
    images: [image('photo-1562157873-818bc0726f68'), image('photo-1503341504253-dff4815485f1')], material: '240 GSM cotton-poly blend', careInstructions: 'Cold wash with similar colours. Air dry.', isNew: true, isFeatured: true, isSoldOut: false,
    seoTitle: 'Scudo Mint Motion Jersey', seoDescription: 'A cool-toned Scudo Clothing jersey for city movement.'
  },
  {
    id: 'away-tee', name: 'Away Day Heavy Tee', slug: 'away-day-heavy-tee',
    description: 'A substantial everyday tee with a boxy silhouette and an understated front mark. Designed to wear, re-wear, and live in.',
    shortDescription: 'Heavyweight off-white tee with a boxy fit.', category: 'T-Shirts', collection: 'Everyday Uniform',
    price: 1490, salePrice: null, currency: 'INR', sku: 'SC-TEE-A03', brand: 'Scudo Clothing', colors: ['Off-white'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], inventory: 28,
    images: [image('photo-1523381210434-271e8be1f52b'), image('photo-1485230895905-ec40ba36b9bc')], material: '260 GSM combed cotton', careInstructions: 'Wash at 30°C. Wash and iron inside out.', isNew: false, isFeatured: true, isSoldOut: false,
    seoTitle: 'Away Day Heavy Tee', seoDescription: 'A heavyweight everyday tee by Scudo Clothing.'
  },
  {
    id: 'touchline-tee', name: 'Touchline Script Tee', slug: 'touchline-script-tee',
    description: 'A softer-weight tee for the hours around the game, with a loose drape and a hand-drawn graphic treatment.',
    shortDescription: 'Soft sand tee with a relaxed drape.', category: 'T-Shirts', collection: 'Matchday',
    price: 1290, salePrice: 990, currency: 'INR', sku: 'SC-TEE-T04', brand: 'Scudo Clothing', colors: ['Sand'], sizes: ['S', 'M', 'L', 'XL'], inventory: 7,
    images: [image('photo-1503342217505-b0a15ec3261c'), image('photo-1529139574466-a303027c1d8b')], material: '200 GSM cotton jersey', careInstructions: 'Cold wash. Do not iron directly on print.', isNew: false, isFeatured: false, isSoldOut: false,
    seoTitle: 'Touchline Script Tee', seoDescription: 'A soft sand everyday tee from the Scudo Matchday collection.'
  },
  {
    id: 'stadium-overshirt', name: 'Stadium Overshirt', slug: 'stadium-overshirt',
    description: 'A lightweight overshirt that holds its shape over a tee and under a jacket. Quiet utility for changing weather.',
    shortDescription: 'Structured charcoal overshirt with utility pockets.', category: 'Outerwear', collection: 'Drop 01',
    price: 3290, salePrice: null, currency: 'INR', sku: 'SC-OUT-S05', brand: 'Scudo Clothing', colors: ['Charcoal'], sizes: ['M', 'L', 'XL'], inventory: 5,
    images: [image('photo-1515886657613-9f3515b0c78f'), image('photo-1490481651871-ab68de25d43d')], material: 'Cotton ripstop', careInstructions: 'Gentle wash. Hang dry.', isNew: true, isFeatured: true, isSoldOut: false,
    seoTitle: 'Stadium Overshirt', seoDescription: 'The Scudo Clothing Stadium Overshirt in charcoal.'
  },
  {
    id: 'first-xi-cap', name: 'First XI Cap', slug: 'first-xi-cap',
    description: 'An everyday six-panel with a low profile and a tonal embroidered mark. The finishing piece for the first drop.',
    shortDescription: 'Tonal six-panel cap with an easy low profile.', category: 'Accessories', collection: 'Drop 01',
    price: 990, salePrice: null, currency: 'INR', sku: 'SC-ACC-F06', brand: 'Scudo Clothing', colors: ['Noir', 'Sand'], sizes: ['One size'], inventory: 0,
    images: [image('photo-1521369909029-2afed882baee'), image('photo-1588850561407-ed78c282e89b')], material: 'Brushed cotton twill', careInstructions: 'Spot clean only.', isNew: false, isFeatured: false, isSoldOut: true,
    seoTitle: 'First XI Cap', seoDescription: 'The First XI Cap from Scudo Clothing.'
  }
]

const collections = [
  { title: 'Jerseys', eyebrow: '01 / Matchday', copy: 'Built for the 90 minutes.', image: image('photo-1521572163474-6864f9cf17ab'), path: '/shop/jerseys', tone: 'ink' },
  { title: 'Matchday', eyebrow: '02 / Before & after', copy: 'The pieces around the game.', image: image('photo-1515886657613-9f3515b0c78f'), path: '/collections?name=matchday', tone: 'sand' },
  { title: 'Everyday Uniform', eyebrow: '03 / Daily rotation', copy: 'Good enough for every day.', image: image('photo-1523381210434-271e8be1f52b'), path: '/collections?name=everyday', tone: 'cream' }
]

const formatMoney = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

function Icon({ name, size = 18 }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 5 5" /></>,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21c.7-3.4 3.1-5.2 7-5.2s6.3 1.8 7 5.2" /></>,
    heart: <path d="M20.8 8.7c0 5.3-8.8 10.1-8.8 10.1S3.2 14 3.2 8.7C3.2 6.1 5 4.2 7.4 4.2c1.5 0 2.8.8 3.6 2  .8-1.2 2.1-2 3.6-2 2.4 0 4.2 1.9 4.2 4.5Z" />,
    bag: <><path d="M5 8.5h14l1 12H4l1-12Z" /><path d="M9 9V6.5a3 3 0 0 1 6 0V9" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    close: <><path d="m5 5 14 14M19 5 5 19" /></>,
    arrow: <><path d="M4 12h15" /><path d="m13 6 6 6-6 6" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    minus: <path d="M5 12h14" />,
    chevron: <path d="m8 10 4 4 4-4" />,
    check: <path d="m5 12 4 4L19 6" />,
    filter: <><path d="M4 6h16M7 12h10M10 18h4" /></>,
    instagram: <><rect x="4" y="4" width="16" height="16" rx="4" /><circle cx="12" cy="12" r="3.5" /><circle cx="17.5" cy="6.7" r=".8" fill="currentColor" stroke="none" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="1" /><path d="m4 7 8 6 8-6" /></>,
    back: <><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></>
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

export function ScudoLogo({ size = 'md', variant = 'default', showSubtitle = true, showShadow = true, primaryColor, accentColor, className = '', mode = 'stacked' }) {
  const maskId = `scudo-shirt-${useId().replace(/:/g, '')}`
  const light = variant === 'light'
  const monochrome = variant === 'monochrome'
  const markOnly = mode === 'mark' || mode === 'favicon'
  const sOnly = mode === 's'
  const horizontal = mode === 'horizontal'
  const style = { '--logo-primary': primaryColor || (light ? '#F7F4EE' : '#111111'), '--logo-accent': accentColor || (monochrome ? (light ? '#F7F4EE' : '#111111') : '#B9A889') }
  return (
    <div className={`scudo-logo scudo-logo--${size} scudo-logo--${variant} ${horizontal ? 'scudo-logo--horizontal' : ''} ${markOnly ? 'scudo-logo--mark-only' : ''} ${sOnly ? 'scudo-logo--s-only' : ''} ${showShadow ? 'has-logo-shadow' : ''} ${className}`} style={style} aria-label="Scudo Clothing" role="img">
      {!sOnly && <svg className="scudo-logo__shirt" viewBox="0 0 180 150" aria-hidden="true" focusable="false"><title>Scudo Clothing shirt mark</title><defs><mask id={maskId}><rect width="180" height="150" fill="white" /><path d="M65 10Q90 42 115 10Q111 43 90 47Q69 43 65 10Z" fill="black" /></mask></defs><path d="M64 10 23 22 10 68 42 79 54 52 47 140H133L126 52 138 79 170 68 157 22 116 10C111 25 103 32 90 32S69 25 64 10Z" fill="var(--logo-accent)" mask={`url(#${maskId})`} /></svg>}
      {sOnly && <span className="scudo-logo__s">S</span>}
      {!markOnly && !sOnly && <div className="scudo-logo__word">scudo</div>}
      {showSubtitle && !markOnly && !sOnly && <div className="scudo-logo__subtitle">CLOTHINGS</div>}
    </div>
  )
}

function usePersistedState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? initialValue } catch { return initialValue }
  })
  useEffect(() => { localStorage.setItem(key, JSON.stringify(value)) }, [key, value])
  return [value, setValue]
}

function useRoute() {
  const [route, setRoute] = useState(() => window.location.pathname + window.location.search)
  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname + window.location.search)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  return route
}

function navigate(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function Link({ to, children, className = '', onClick, ...props }) {
  return <a href={to} className={className} onClick={(event) => { if (!props.target) { event.preventDefault(); navigate(to) } onClick?.(event) }} {...props}>{children}</a>
}

function Header({ cartCount, wishlistCount, onCartOpen }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [announcement, setAnnouncement] = usePersistedState('scudo-announcement', 'DROP 01 — THE FIRST XI')
  const nav = [['New arrivals', '/shop?sort=newest'], ['Jerseys', '/shop/jerseys'], ['T-shirts', '/shop/t-shirts'], ['Collections', '/collections'], ['About', '/about']]
  return <>
    <div className="announcement"><span>{announcement}</span><button onClick={() => setAnnouncement(announcement === 'DROP 01 — THE FIRST XI' ? 'MATCHDAY / EVERYDAY' : 'DROP 01 — THE FIRST XI')} aria-label="Change announcement"><Icon name="chevron" size={13} /></button></div>
    <header className="site-header">
      <div className="header-inner">
        <button className="icon-button mobile-menu-button" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Icon name="menu" /></button>
        <Link to="/" className="header-logo"><ScudoLogo size="sm" showSubtitle /></Link>
        <nav className="desktop-nav" aria-label="Primary navigation">{nav.map(([label, path]) => <Link key={path} to={path}>{label}</Link>)}</nav>
        <div className="header-actions">
          <Link to="/shop" className="icon-button" aria-label="Search"><Icon name="search" /></Link>
          <Link to="/account" className="icon-button header-account" aria-label="Account"><Icon name="user" /></Link>
          <Link to="/wishlist" className="icon-button with-count" aria-label={`Wishlist, ${wishlistCount} items`}><Icon name="heart" />{wishlistCount > 0 && <span>{wishlistCount}</span>}</Link>
          <button className="icon-button with-count" onClick={onCartOpen} aria-label={`Shopping bag, ${cartCount} items`}><Icon name="bag" />{cartCount > 0 && <span>{cartCount}</span>}</button>
        </div>
      </div>
    </header>
    {menuOpen && <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)}><aside className="mobile-drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-top"><ScudoLogo size="sm" showSubtitle={false} /><button className="icon-button" onClick={() => setMenuOpen(false)} aria-label="Close menu"><Icon name="close" /></button></div><nav>{nav.map(([label, path]) => <Link key={path} to={path} onClick={() => setMenuOpen(false)}>{label}<Icon name="arrow" size={16} /></Link>)}</nav><div className="mobile-menu-footer"><Link to="/size-guide" onClick={() => setMenuOpen(false)}>Size guide</Link><Link to="/shipping-returns" onClick={() => setMenuOpen(false)}>Shipping & returns</Link><Link to="/contact" onClick={() => setMenuOpen(false)}>Contact</Link></div></aside></div>}
  </>
}

function Footer({ onSubscribe }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const submit = (event) => { event.preventDefault(); if (email.includes('@')) { setSent(true); onSubscribe?.(email) } }
  return <footer className="site-footer"><div className="footer-top"><div className="footer-brand"><ScudoLogo variant="light" size="sm" /><p>Football-inspired pieces for the 90 minutes and everything after.</p><div className="socials"><a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><Icon name="instagram" /></a><a href="mailto:hello@scudoclothing.com" aria-label="Email Scudo Clothing"><Icon name="mail" /></a></div></div><div className="footer-links"><div><p className="footer-label">Shop</p><Link to="/shop">All pieces</Link><Link to="/shop/jerseys">Jerseys</Link><Link to="/shop/t-shirts">T-shirts</Link><Link to="/collections">Collections</Link></div><div><p className="footer-label">Customer care</p><Link to="/size-guide">Size guide</Link><Link to="/shipping-returns">Shipping & returns</Link><Link to="/contact">Contact</Link><Link to="/account">Account</Link></div><div className="footer-signup"><p className="footer-label">The team sheet</p><p>Drop notes, new pieces, no noise.</p><form onSubmit={submit}><label className="sr-only" htmlFor="footer-email">Email address</label><input id="footer-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" required /><button type="submit" aria-label="Subscribe"><Icon name="arrow" /></button></form>{sent ? <span className="form-success">You're on the list.</span> : <span className="form-note">By subscribing, you agree to our updates.</span>}</div></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Scudo Clothing</span><div><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/admin">Store admin</Link></div><span>Made for movement.</span></div></footer>
}

function ProductCard({ product, onQuickAdd, wishlist, onToggleWishlist }) {
  const isWished = wishlist.includes(product.id)
  return <article className="product-card"><div className="product-image-wrap"><Link to={`/product/${product.slug}`} className="product-image-link"><img src={product.images[0]} alt={`${product.name} — ${product.shortDescription}`} loading="lazy" /><span className="product-status">{product.isSoldOut ? 'Sold out' : product.isNew ? 'New' : product.salePrice ? 'Sale' : 'Available'}</span></Link><WishlistButton active={isWished} onClick={() => onToggleWishlist(product.id)} /><button className="quick-add" onClick={() => onQuickAdd(product)} disabled={product.isSoldOut}>{product.isSoldOut ? 'Sold out' : 'Quick add'}<Icon name="plus" size={15} /></button></div><div className="product-meta"><Link to={`/product/${product.slug}`} className="product-name">{product.name}</Link><div className="product-price">{product.salePrice ? <><span className="sale-price">{formatMoney(product.salePrice)}</span><span className="was-price">{formatMoney(product.price)}</span></> : formatMoney(product.price)}</div><div className="product-detail-line"><span>{product.colors.join(' / ')}</span><span>{product.sizes.length} sizes</span></div></div></article>
}

function WishlistButton({ active, onClick }) { return <button className={`wishlist-button ${active ? 'is-active' : ''}`} onClick={onClick} aria-label={active ? 'Remove from wishlist' : 'Add to wishlist'}><Icon name="heart" size={17} /></button> }

function Breadcrumbs({ items }) { return <div className="breadcrumbs"><Link to="/">Home</Link><span>/</span>{items.map((item, index) => <span key={index} className={index === items.length - 1 ? 'current' : ''}>{item.path ? <Link to={item.path}>{item.label}</Link> : item.label}</span>)}</div> }

function SectionHeading({ eyebrow, title, copy, action }) { return <div className="section-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>{copy && <p>{copy}</p>}{action}</div> }

function HomePage({ wishlist, onToggleWishlist, onQuickAdd }) {
  const featured = products.filter((p) => p.isFeatured)
  const arrivals = products.filter((p) => p.isNew)
  return <main>
    <section className="hero"><div className="hero-copy"><span className="eyebrow">Scudo Clothing / Drop 01</span><h1>Built for the<br /><em>90 minutes</em><br />and everything after.</h1><p>Football-inspired pieces made for match days, city nights, and everyday movement.</p><div className="button-row"><Link to="/shop?sort=newest" className="button button-dark">Shop new arrivals <Icon name="arrow" size={16} /></Link><Link to="/shop/jerseys" className="button button-ghost">Explore jerseys</Link></div><div className="hero-note"><span className="hero-note-dot" /> The first team sheet is now live</div></div><div className="hero-visual"><img src={products[0].images[0]} alt="Scudo Noir Crest Jersey editorial product image" /><div className="hero-stamp"><span>SC</span><span>01 / 11</span></div><div className="hero-caption"><span>Scudo Noir Crest Jersey</span><span>02.26 — Drop 01</span></div></div></section>
    <section className="section section-featured"><SectionHeading eyebrow="The starting XI" title="Pieces in play" copy="The ones we reach for first." action={<Link to="/shop" className="text-link">View all <Icon name="arrow" size={15} /></Link>} /><div className="product-grid product-grid--four">{featured.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} onQuickAdd={onQuickAdd} wishlist={wishlist} onToggleWishlist={onToggleWishlist} />)}</div></section>
    <section className="editorial-band"><div><span className="eyebrow">A note from the touchline</span><h2>Everyday uniform,<br /><em>matchday energy.</em></h2></div><p>Scudo is a study in the pieces around the game — the warm-up, the walk home, the long conversations after full time.</p><Link to="/about" className="circle-link" aria-label="Read the Scudo story"><Icon name="arrow" size={22} /></Link></section>
    <section className="section new-arrivals"><SectionHeading eyebrow="Just in" title="New arrivals" copy="First out of the tunnel." action={<Link to="/shop?sort=newest" className="text-link">Shop all <Icon name="arrow" size={15} /></Link>} /><div className="product-row">{arrivals.map((product) => <ProductCard key={product.id} product={product} onQuickAdd={onQuickAdd} wishlist={wishlist} onToggleWishlist={onToggleWishlist} />)}</div></section>
    <section className="section collection-section"><SectionHeading eyebrow="Choose your rotation" title="Collections" copy="Three ways to wear the game." /><div className="collection-grid">{collections.map((collection) => <Link to={collection.path} className={`collection-card collection-card--${collection.tone}`} key={collection.title}><img src={collection.image} alt={`${collection.title} collection`} loading="lazy" /><div className="collection-overlay"><span className="eyebrow">{collection.eyebrow}</span><h3>{collection.title}</h3><span className="collection-copy">{collection.copy}</span><span className="circle-link circle-link--small"><Icon name="arrow" size={17} /></span></div></Link>)}</div></section>
    <section className="story-section"><div className="story-image"><img src={image('photo-1506629905607-d9b1f1ecf7ba')} alt="Scudo Clothing editorial detail" loading="lazy" /></div><div className="story-copy"><span className="eyebrow">The Scudo idea</span><h2>Not a kit.<br /><em>A point of view.</em></h2><p>Scudo Clothing brings the codes of football into the everyday — considered fabrics, easy silhouettes, and the confidence to wear your colours your way.</p><Link to="/about" className="text-link">Read our story <Icon name="arrow" size={15} /></Link><div className="story-aside"><span>01</span><span>Football culture,<br />translated for daily life.</span></div></div></section>
    <section className="benefits-section"><div className="benefit-intro"><span className="eyebrow">The fine print</span><h2>Good pieces<br /><em>make good days.</em></h2></div><div className="benefit-grid">{[['01', 'Quality-first pieces', 'Thoughtful materials, made to be worn often.'], ['02', 'Comfortable everyday fit', 'Relaxed proportions for movement beyond the pitch.'], ['03', 'Limited-release collections', 'Small runs, considered drops, no unnecessary noise.'], ['04', 'Easy returns', 'Changed your mind? We keep the process straightforward.']].map(([number, title, copy]) => <div className="benefit" key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></div>)}</div></section>
    <Newsletter />
  </main>
}

function Newsletter() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const submit = (event) => { event.preventDefault(); setStatus(email.includes('@') ? 'success' : 'error') }
  return <section className="newsletter"><div><span className="eyebrow">Stay in the loop</span><h2>Join the team sheet.</h2><p>Drop notes, new pieces, and the occasional good idea. No noise.</p></div><form onSubmit={submit} className="newsletter-form"><label className="sr-only" htmlFor="newsletter-email">Email address</label><input id="newsletter-email" type="email" placeholder="Email address" value={email} onChange={(e) => { setEmail(e.target.value); setStatus('idle') }} required /><button className="button button-light" type="submit">Subscribe <Icon name="arrow" size={16} /></button>{status === 'success' && <span className="form-success">You're on the list.</span>}{status === 'error' && <span className="form-error">Enter a valid email address.</span>}</form></section>
}

function ShopPage({ wishlist, onToggleWishlist, onQuickAdd, initialCategory }) {
  const params = new URLSearchParams(window.location.search)
  const [search, setSearch] = useState(params.get('q') || '')
  const [category, setCategory] = useState(initialCategory || 'All')
  const [size, setSize] = useState('All sizes')
  const [color, setColor] = useState('All colours')
  const [sort, setSort] = useState(params.get('sort') || 'featured')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const categories = ['All', 'Jerseys', 'T-Shirts', 'Outerwear', 'Accessories']
  const sizes = ['All sizes', 'S', 'M', 'L', 'XL', 'XXL']
  const colors = ['All colours', 'Noir', 'Sand', 'Mint', 'Off-white', 'Charcoal']
  const filtered = useMemo(() => products.filter((product) => {
    const matchesSearch = `${product.name} ${product.description}`.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'All' || product.category === category
    const matchesSize = size === 'All sizes' || product.sizes.includes(size)
    const matchesColor = color === 'All colours' || product.colors.includes(color)
    return matchesSearch && matchesCategory && matchesSize && matchesColor
  }).sort((a, b) => sort === 'newest' ? Number(b.isNew) - Number(a.isNew) : sort === 'price-low' ? (a.salePrice || a.price) - (b.salePrice || b.price) : sort === 'price-high' ? (b.salePrice || b.price) - (a.salePrice || a.price) : Number(b.isFeatured) - Number(a.isFeatured)), [search, category, size, color, sort])
  const clear = () => { setSearch(''); setCategory('All'); setSize('All sizes'); setColor('All colours'); setSort('featured') }
  return <main className="shop-page"><div className="page-shell"><Breadcrumbs items={[{ label: initialCategory || 'Shop' }]} /><div className="shop-heading"><div><span className="eyebrow">The full rotation</span><h1>{initialCategory || 'Shop all'}</h1></div><p>Pieces to take you from kick-off to last call.</p></div><div className="shop-toolbar"><button className="filter-trigger" onClick={() => setFiltersOpen(true)}><Icon name="filter" size={16} /> Filters</button><span className="product-count">{filtered.length} pieces</span><div className="sort-select"><label htmlFor="sort">Sort by</label><select id="sort" value={sort} onChange={(e) => setSort(e.target.value)}><option value="featured">Featured</option><option value="newest">Newest</option><option value="price-low">Price low to high</option><option value="price-high">Price high to low</option></select><Icon name="chevron" size={14} /></div></div><div className="shop-layout"><aside className={`shop-filters ${filtersOpen ? 'is-open' : ''}`}><div className="filters-head"><span>Filter the rotation</span><button className="icon-button" onClick={() => setFiltersOpen(false)} aria-label="Close filters"><Icon name="close" /></button></div><label className="filter-search"><span>Search</span><div><Icon name="search" size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search pieces" /></div></label><FilterGroup label="Category" options={categories} value={category} onChange={setCategory} /><FilterGroup label="Size" options={sizes} value={size} onChange={setSize} /><FilterGroup label="Colour" options={colors} value={color} onChange={setColor} /><button className="text-link clear-filter" onClick={clear}>Clear filters</button><button className="button button-dark filter-done" onClick={() => setFiltersOpen(false)}>View {filtered.length} pieces</button></aside>{filtersOpen && <div className="filter-backdrop" onClick={() => setFiltersOpen(false)} />}<div className="shop-results">{filtered.length ? <div className="product-grid product-grid--three">{filtered.map((product) => <ProductCard key={product.id} product={product} onQuickAdd={onQuickAdd} wishlist={wishlist} onToggleWishlist={onToggleWishlist} />)}</div> : <EmptyState title="Nothing in this formation" copy="Try a different filter or clear the rotation to see every piece." action={<button className="button button-dark" onClick={clear}>Clear filters</button>} />}</div></div></div></main>
}

function FilterGroup({ label, options, value, onChange }) { return <fieldset className="filter-group"><legend>{label}</legend>{options.map((option) => <label key={option} className="radio-row"><input type="radio" name={label} checked={value === option} onChange={() => onChange(option)} /><span>{option}</span><i /></label>)}</fieldset> }

function EmptyState({ title, copy, action }) { return <div className="empty-state"><div className="empty-mark">SC</div><span className="eyebrow">Nothing here yet</span><h2>{title}</h2><p>{copy}</p>{action}</div> }

function ProductPage({ product, wishlist, onToggleWishlist, onAddToCart }) {
  const [activeImage, setActiveImage] = useState(0)
  const [size, setSize] = useState('')
  const [color, setColor] = useState(product.colors[0])
  const [quantity, setQuantity] = useState(1)
  const [reviewSent, setReviewSent] = useState(false)
  const wished = wishlist.includes(product.id)
  const add = () => size && onAddToCart(product, size, color, quantity)
  return <main className="product-page"><div className="page-shell"><Breadcrumbs items={[{ label: product.category, path: `/shop/${product.category.toLowerCase().replace(' ', '-')}` }, { label: product.name }]} /><div className="product-detail"><div className="product-gallery"><div className="gallery-main"><img src={product.images[activeImage]} alt={`${product.name} view ${activeImage + 1}`} /><button className="zoom-hint" aria-label="Product image zoom">Click to zoom</button></div><div className="gallery-thumbs">{product.images.map((src, index) => <button key={src} className={activeImage === index ? 'is-active' : ''} onClick={() => setActiveImage(index)}><img src={src} alt={`${product.name} thumbnail ${index + 1}`} /></button>)}</div></div><div className="product-info"><span className="eyebrow">{product.collection} / {product.category}</span><h1>{product.name}</h1><div className="detail-price">{product.salePrice ? <><span className="sale-price">{formatMoney(product.salePrice)}</span><span className="was-price">{formatMoney(product.price)}</span></> : formatMoney(product.price)} <span className="tax-note">incl. taxes</span></div><p className="detail-description">{product.description}</p><div className="selector-block"><div className="selector-label"><span>Colour</span><strong>{color}</strong></div><div className="swatches">{product.colors.map((item) => <button key={item} className={`swatch swatch--${item.toLowerCase().replace('-', '')} ${color === item ? 'is-selected' : ''}`} onClick={() => setColor(item)} aria-label={`Select ${item}`}><span /></button>)}</div></div><div className="selector-block"><div className="selector-label"><span>Size</span><Link to="/size-guide">Size guide <Icon name="arrow" size={13} /></Link></div><div className="size-grid">{product.sizes.map((item) => <button key={item} className={size === item ? 'is-selected' : ''} onClick={() => setSize(item)}>{item}</button>)}</div>{!size && <span className="selection-note">Select a size to add this piece.</span>}</div><div className="add-row"><div className="quantity-control"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity"><Icon name="minus" size={15} /></button><span>{quantity}</span><button onClick={() => setQuantity(Math.min(product.inventory || 1, quantity + 1))} aria-label="Increase quantity"><Icon name="plus" size={15} /></button></div><button className="button button-dark add-to-bag" onClick={add} disabled={!size || product.isSoldOut}>{product.isSoldOut ? 'Sold out' : !size ? 'Select a size' : 'Add to bag'} <Icon name="arrow" size={16} /></button><button className={`icon-button detail-wishlist ${wished ? 'is-active' : ''}`} onClick={() => onToggleWishlist(product.id)} aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}><Icon name="heart" /></button></div><div className="detail-notes"><div><span>Shipping</span><p>Ships in 2–4 business days across India.</p></div><div><span>Returns</span><p>Easy returns within 7 days of delivery.</p></div><div><span>Details</span><p>{product.material}. {product.careInstructions}</p></div></div><div className="sku-line"><span>SKU {product.sku}</span><span>Scudo Clothing</span></div></div></div><section className="product-lower"><div><span className="eyebrow">Reviews / 03</span><h2>Worn in the wild.</h2></div><div className="review-content"><div className="review-card"><div className="stars">★★★★★</div><p>“Good weight, easy fit. It’s become the jersey I reach for even when there isn’t a game on.”</p><span>— A. Mehta / Verified buyer</span></div><form className="review-form" onSubmit={(event) => { event.preventDefault(); setReviewSent(true) }}><span className="form-title">Leave a review</span><input required placeholder="Your name" aria-label="Your name" /><textarea required placeholder="What did you think?" aria-label="Your review" rows="3" /><button className="button button-ghost" type="submit">{reviewSent ? 'Review submitted' : 'Submit review'}</button></form></div></section><section className="section related-section"><SectionHeading eyebrow="Complete the rotation" title="You may also like" /><div className="product-grid product-grid--four">{products.filter((item) => item.id !== product.id).slice(0, 4).map((item) => <ProductCard key={item.id} product={item} onQuickAdd={(p) => onAddToCart(p, p.sizes[0], p.colors[0], 1)} wishlist={wishlist} onToggleWishlist={onToggleWishlist} />)}</div></section></div></main>
}

function CartDrawer({ open, onClose, cart, onUpdateQuantity, onRemove, onCheckout }) {
  const subtotal = cart.reduce((total, item) => total + (item.product.salePrice || item.product.price) * item.quantity, 0)
  return open ? <div className="drawer-overlay" onClick={onClose}><aside className="cart-drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-head"><div><span className="eyebrow">Your rotation</span><h2>Shopping bag <small>{cart.reduce((a, i) => a + i.quantity, 0)}</small></h2></div><button className="icon-button" onClick={onClose} aria-label="Close shopping bag"><Icon name="close" /></button></div>{cart.length ? <><div className="drawer-items">{cart.map((item) => <CartLine key={`${item.product.id}-${item.size}-${item.color}`} item={item} onUpdateQuantity={onUpdateQuantity} onRemove={onRemove} compact />)}</div><div className="drawer-summary"><div><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div><p>Shipping calculated at checkout.</p><button className="button button-dark" onClick={onCheckout}>Go to checkout <Icon name="arrow" size={16} /></button><Link to="/cart" className="text-link" onClick={onClose}>View bag</Link></div></> : <EmptyState title="Your bag is empty" copy="Add a piece and it will show up here." action={<Link to="/shop" className="button button-dark" onClick={onClose}>Shop the rotation</Link>} />}</aside></div> : null
}

function CartLine({ item, onUpdateQuantity, onRemove, compact = false }) { const price = item.product.salePrice || item.product.price; return <div className={`cart-line ${compact ? 'cart-line--compact' : ''}`}><img src={item.product.images[0]} alt={item.product.name} /><div className="cart-line-info"><Link to={`/product/${item.product.slug}`}>{item.product.name}</Link><span>{item.color} / {item.size}</span><strong>{formatMoney(price * item.quantity)}</strong><div className="mini-quantity"><button onClick={() => onUpdateQuantity(item.key, item.quantity - 1)} aria-label="Decrease quantity"><Icon name="minus" size={12} /></button><span>{item.quantity}</span><button onClick={() => onUpdateQuantity(item.key, item.quantity + 1)} aria-label="Increase quantity"><Icon name="plus" size={12} /></button></div></div><button className="remove-line" onClick={() => onRemove(item.key)} aria-label={`Remove ${item.product.name}`}><Icon name="close" size={15} /></button></div> }

function CartPage({ cart, onUpdateQuantity, onRemove, onCheckout }) {
  const subtotal = cart.reduce((total, item) => total + (item.product.salePrice || item.product.price) * item.quantity, 0)
  const shipping = subtotal >= 3500 || subtotal === 0 ? 0 : 150
  const tax = Math.round(subtotal * 0.05)
  return <main className="cart-page"><div className="page-shell"><Breadcrumbs items={[{ label: 'Shopping bag' }]} /><div className="cart-heading"><div><span className="eyebrow">Review your rotation</span><h1>Shopping bag</h1></div>{cart.length > 0 && <span>{cart.reduce((a, i) => a + i.quantity, 0)} pieces</span>}</div>{cart.length ? <div className="cart-layout"><div className="cart-items">{cart.map((item) => <CartLine key={item.key} item={item} onUpdateQuantity={onUpdateQuantity} onRemove={onRemove} />)}<Link to="/shop" className="text-link back-link"><Icon name="back" size={15} /> Continue shopping</Link></div><OrderSummary subtotal={subtotal} shipping={shipping} tax={tax} onCheckout={onCheckout} /></div> : <EmptyState title="No pieces yet" copy="Your bag is waiting for its first addition." action={<Link to="/shop" className="button button-dark">Shop the rotation</Link>} />}</div></main>
}

function OrderSummary({ subtotal, shipping, tax, onCheckout, checkoutLabel = 'Checkout' }) { return <aside className="order-summary"><span className="eyebrow">Summary</span><h2>Matchday total</h2><div className="summary-lines"><div><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div><div><span>Shipping</span><strong>{shipping ? formatMoney(shipping) : 'Complimentary'}</strong></div><div><span>Estimated tax</span><strong>{formatMoney(tax)}</strong></div></div><div className="summary-total"><span>Total</span><strong>{formatMoney(subtotal + shipping + tax)}</strong></div><button className="button button-dark" onClick={onCheckout} disabled={!subtotal}>{checkoutLabel} <Icon name="arrow" size={16} /></button><p className="secure-note">Demo checkout mode · no payment is processed.</p></aside> }

function CheckoutPage({ cart, onPlaceOrder }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: '', state: '', country: 'India', postal: '', payment: 'upi', terms: false })
  const [error, setError] = useState('')
  const subtotal = cart.reduce((total, item) => total + (item.product.salePrice || item.product.price) * item.quantity, 0)
  const shipping = subtotal >= 3500 || subtotal === 0 ? 0 : 150
  const tax = Math.round(subtotal * 0.05)
  const total = subtotal + shipping + tax
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const validateAndPlace = () => { if (!form.terms) return setError('Please accept the terms and privacy policy to continue.'); if (!form.name || !form.email || !form.address || !form.city || !form.postal) return setError('Please complete the required delivery details.'); onPlaceOrder({ ...form, total, items: cart }) }
  const submit = (event) => { event.preventDefault(); validateAndPlace() }
  return <main className="checkout-page"><div className="page-shell"><Breadcrumbs items={[{ label: 'Checkout' }]} /><div className="checkout-heading"><span className="eyebrow">Secure demo checkout</span><h1>Ready when you are.</h1><p>Your order is reserved in demo mode. Connect Razorpay or Stripe through the environment variables before accepting live payments.</p></div>{!cart.length ? <EmptyState title="Your bag is empty" copy="Add something before checking out." action={<Link to="/shop" className="button button-dark">Shop the rotation</Link>} /> : <form className="checkout-layout" onSubmit={submit}><div className="checkout-form"><FormSection title="Contact"><div className="form-grid"><Field label="Full name" value={form.name} onChange={(v) => update('name', v)} required /><Field label="Email address" type="email" value={form.email} onChange={(v) => update('email', v)} required /><Field label="Phone number" value={form.phone} onChange={(v) => update('phone', v)} /></div></FormSection><FormSection title="Delivery address"><div className="form-grid"><Field label="Address" value={form.address} onChange={(v) => update('address', v)} required wide /><Field label="City" value={form.city} onChange={(v) => update('city', v)} required /><Field label="State" value={form.state} onChange={(v) => update('state', v)} /><Field label="Country" value={form.country} onChange={(v) => update('country', v)} /><Field label="Postal code" value={form.postal} onChange={(v) => update('postal', v)} required /></div></FormSection><FormSection title="Payment"><div className="payment-note"><span className="demo-badge">DEMO MODE</span><p>Payment credentials are not configured. This order will be marked as awaiting payment and will not charge a card.</p></div><div className="payment-options">{[['upi', 'UPI'], ['card', 'Credit / debit card'], ['netbanking', 'Net banking'], ['cod', 'Cash on delivery']].map(([value, label]) => <label key={value} className={`payment-option ${form.payment === value ? 'is-selected' : ''}`}><input type="radio" name="payment" checked={form.payment === value} onChange={() => update('payment', value)} /><span>{label}</span></label>)}</div></FormSection><label className="checkbox-row"><input type="checkbox" checked={form.terms} onChange={(e) => update('terms', e.target.checked)} /><span>I agree to the <Link to="/terms">terms</Link> and <Link to="/privacy">privacy policy</Link>.</span></label>{error && <p className="form-error form-error--block">{error}</p>}<button className="button button-dark place-order" type="submit">Place demo order <Icon name="arrow" size={16} /></button></div><OrderSummary subtotal={subtotal} shipping={shipping} tax={tax} checkoutLabel="Place order" onCheckout={validateAndPlace} /></form>}</div></main>
}

function FormSection({ title, children }) { return <section className="form-section"><h2>{title}</h2>{children}</section> }
function Field({ label, type = 'text', value, onChange, required, wide }) { return <label className={`field ${wide ? 'field--wide' : ''}`}><span>{label}{required && ' *'}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} /></label> }

function OrderConfirmation({ order }) { return <main className="confirmation-page"><div className="confirmation-card"><div className="confirmation-mark"><Icon name="check" size={26} /></div><span className="eyebrow">Order received / {order?.number || 'SC-DEMO'}</span><h1>See you on the other side.</h1><p>Your demo order is safely captured. No payment has been processed; connect a provider before launch.</p><div className="confirmation-meta"><div><span>Payment status</span><strong>Awaiting payment</strong></div><div><span>Estimated delivery</span><strong>2–4 business days</strong></div><div><span>Ship to</span><strong>{order?.city || 'Your city'}, {order?.country || 'India'}</strong></div></div><Link to="/shop" className="button button-dark">Continue shopping <Icon name="arrow" size={16} /></Link></div></main> }

function WishlistPage({ wishlist, onToggleWishlist, onQuickAdd }) { const wished = products.filter((product) => wishlist.includes(product.id)); return <main className="shop-page wishlist-page"><div className="page-shell"><Breadcrumbs items={[{ label: 'Wishlist' }]} /><div className="shop-heading"><div><span className="eyebrow">Saved for later</span><h1>Your wishlist</h1></div><p>{wished.length ? `${wished.length} pieces saved.` : 'Keep the good ones close.'}</p></div>{wished.length ? <div className="product-grid product-grid--four">{wished.map((product) => <ProductCard key={product.id} product={product} onQuickAdd={onQuickAdd} wishlist={wishlist} onToggleWishlist={onToggleWishlist} />)}</div> : <EmptyState title="Your list is quiet" copy="Tap the heart on a piece to save it for later." action={<Link to="/shop" className="button button-dark">Shop the rotation</Link>} />}</div></main> }

function CollectionsPage() { return <main className="collections-page"><div className="page-shell"><Breadcrumbs items={[{ label: 'Collections' }]} /><div className="shop-heading"><div><span className="eyebrow">The edit</span><h1>Collections</h1></div><p>Different moods, one point of view.</p></div><div className="collection-list">{collections.map((collection, index) => <Link to={collection.path} className={`collection-feature collection-feature--${collection.tone}`} key={collection.title}><img src={collection.image} alt={`${collection.title} collection`} /><div><span className="eyebrow">{collection.eyebrow}</span><h2>{collection.title}</h2><p>{collection.copy}</p><span className="text-link">Explore collection <Icon name="arrow" size={15} /></span></div><span className="collection-number">0{index + 1}</span></Link>)}</div></div></main> }

function InfoPage({ type }) {
  const content = { about: { eyebrow: 'The Scudo idea', title: <>Not a kit.<br /><em>A point of view.</em></>, intro: 'Scudo Clothing is a football-inspired streetwear label for people who see the game as more than a scoreline.', sections: [['The 90 minutes and everything after', 'We make pieces for the full day around the game — the walk to the stadium, the first coffee, the late train home, and every ordinary moment in between.'], ['Our first team sheet', 'Scudo starts with small, considered drops: relaxed shapes, familiar colours, and details that feel lived-in from the first wear. The goal is simple — build an everyday rotation that carries a little matchday energy.']] }, 'size-guide': { eyebrow: 'Find your fit', title: <>The right<br /><em>formation.</em></>, intro: 'Our fits are designed with room to move. Take your usual size for an easy fit, or size down for a closer silhouette.', sections: [['T-shirts & jerseys', 'Measure around the chest at the fullest point. Compare with the chart below. Jerseys are designed to feel relaxed.'], ['Size guide', 'S — 36–38 in chest · M — 39–41 in chest · L — 42–44 in chest · XL — 45–47 in chest · XXL — 48–50 in chest']] }, 'shipping-returns': { eyebrow: 'Customer care', title: <>Keep it<br /><em>moving.</em></>, intro: 'We keep shipping and returns straightforward so you can focus on the pieces, not the process.', sections: [['Shipping', 'Orders ship across India in 2–4 business days. You’ll receive tracking details once your order leaves us. Shipping costs are calculated at checkout.'], ['Returns', 'Unused pieces can be returned within 7 days of delivery. Please keep original tags attached. Start a return by emailing hello@scudoclothing.com.']] }, contact: { eyebrow: 'Say hello', title: <>Over to<br /><em>you.</em></>, intro: 'Questions about a piece, a fit, or a future drop? The line is open.', sections: [['Email', 'hello@scudoclothing.com'], ['Hours', 'Monday–Friday, 10:00–18:00 IST. We aim to reply within two business days.']] }, privacy: { eyebrow: 'Legal / Privacy', title: <>Your data,<br /><em>handled lightly.</em></>, intro: 'This starter policy page is intentionally concise and should be reviewed with your legal advisor before launch.', sections: [['What we collect', 'We collect the details needed to process an order, provide support, and send updates when you choose to subscribe. We do not store raw card information.'], ['Your choices', 'Email hello@scudoclothing.com to ask about access, correction, or deletion of personal information.']] }, terms: { eyebrow: 'Legal / Terms', title: <>The ground<br /><em>rules.</em></>, intro: 'These starter terms outline the basic store relationship and should be reviewed with your legal advisor before launch.', sections: [['Orders', 'Product availability, pricing, and content are editable store fields. An order is confirmed only after the configured payment provider accepts it.'], ['Returns & support', 'Please follow the current shipping and returns policy for eligibility. Contact hello@scudoclothing.com for help with an order.']] } }[type]
  return <main className="info-page"><div className="page-shell"><Breadcrumbs items={[{ label: type === 'about' ? 'About' : type === 'size-guide' ? 'Size guide' : type === 'shipping-returns' ? 'Shipping & returns' : 'Contact' }]} /><div className="info-hero"><span className="eyebrow">{content.eyebrow}</span><h1>{content.title}</h1><p>{content.intro}</p></div><div className="info-sections">{content.sections.map(([title, copy]) => <section key={title}><span className="eyebrow">{title}</span><p>{copy}</p></section>)}</div>{type === 'size-guide' && <div className="size-table"><div className="size-table-head"><span>Size</span><span>Chest</span><span>Length</span></div>{[['S','36–38 in','27 in'],['M','39–41 in','28 in'],['L','42–44 in','29 in'],['XL','45–47 in','30 in'],['XXL','48–50 in','31 in']].map((row) => <div className="size-table-row" key={row[0]}>{row.map((value) => <span key={value}>{value}</span>)}</div>)}</div>} {type === 'contact' && <a className="button button-dark" href="mailto:hello@scudoclothing.com">Email the team <Icon name="arrow" size={16} /></a>}</div></main>
}

function AccountPage() { const [mode, setMode] = useState('login'); const [submitted, setSubmitted] = useState(false); return <main className="account-page"><div className="account-card"><ScudoLogo size="sm" /><span className="eyebrow">{mode === 'login' ? 'Welcome back' : 'Join the team'}</span><h1>{mode === 'login' ? 'Log in to your account.' : 'Create your account.'}</h1><form onSubmit={(e) => { e.preventDefault(); setSubmitted(true) }}><Field label="Email address" type="email" onChange={() => {}} value="" required /><Field label="Password" type="password" onChange={() => {}} value="" required /><button className="button button-dark" type="submit">{submitted ? 'Demo access granted' : mode === 'login' ? 'Log in' : 'Create account'} <Icon name="arrow" size={16} /></button></form><button className="text-link account-toggle" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setSubmitted(false) }}>{mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Log in'}</button><p className="demo-note">Demo mode is active. Connect Supabase or Firebase to persist customer accounts.</p></div></main> }

function AdminPage() { const [authed, setAuthed] = usePersistedState('scudo-admin-auth', false); const [announcement, setAnnouncement] = usePersistedState('scudo-announcement', 'DROP 01 — THE FIRST XI'); const [saved, setSaved] = useState(false); if (!authed) return <main className="account-page"><div className="account-card"><span className="eyebrow">Store admin</span><h1>Keep the team sheet current.</h1><p>Protected demo foundation for catalog, inventory, content, and order operations.</p><button className="button button-dark" onClick={() => setAuthed(true)}>Enter demo dashboard <Icon name="arrow" size={16} /></button><p className="demo-note">Demo access only. Replace this gate with your auth provider before launch.</p></div></main>; return <main className="admin-page"><div className="page-shell"><div className="admin-header"><div><span className="eyebrow">Scudo / Store admin</span><h1>Good morning, manager.</h1></div><button className="button button-ghost" onClick={() => setAuthed(false)}>Log out</button></div><div className="admin-stats">{[['Live products', products.filter((p) => !p.isSoldOut).length, 'catalog'], ['Inventory value', formatMoney(products.reduce((sum, p) => sum + p.price * p.inventory, 0)), 'at retail'], ['Low stock', products.filter((p) => p.inventory > 0 && p.inventory < 8).length, 'needs a look'], ['Orders today', 'Demo', 'connect payments']].map(([label, value, note]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>)}</div><div className="admin-grid"><section className="admin-panel"><div className="panel-heading"><div><span className="eyebrow">Content</span><h2>Announcement bar</h2></div><span className="status-pill">Live</span></div><p>Edit the message shown above the storefront header.</p><div className="admin-edit-row"><input value={announcement} onChange={(e) => { setAnnouncement(e.target.value); setSaved(false) }} /><button className="button button-dark" onClick={() => setSaved(true)}>Save</button></div>{saved && <span className="form-success">Saved to demo store.</span>}</section><section className="admin-panel"><div className="panel-heading"><div><span className="eyebrow">Catalog</span><h2>Products</h2></div><Link to="/shop" className="text-link">View storefront <Icon name="arrow" size={14} /></Link></div><div className="admin-products">{products.map((product) => <div key={product.id}><img src={product.images[0]} alt="" /><span>{product.name}<small>{product.sku}</small></span><strong className={product.inventory < 8 ? 'low-stock' : ''}>{product.isSoldOut ? 'Sold out' : `${product.inventory} in stock`}</strong><button className="icon-button" aria-label={`Edit ${product.name}`}><Icon name="chevron" size={15} /></button></div>)}</div></section><section className="admin-panel"><div className="panel-heading"><div><span className="eyebrow">Operations</span><h2>Next connections</h2></div></div><div className="admin-checklist">{['Product image storage', 'Razorpay / Stripe payments', 'Supabase authentication', 'Orders + fulfillment webhooks'].map((item, i) => <div key={item}><span className={i === 0 ? 'check is-done' : 'check'}>{i === 0 && <Icon name="check" size={13} />}</span>{item}<span className="connection-status">{i === 0 ? 'Ready for upload' : 'Not configured'}</span></div>)}</div></section></div></div></main> }

export default function App() {
  const route = useRoute()
  const path = window.location.pathname
  const [wishlist, setWishlist] = usePersistedState('scudo-wishlist', [])
  const [cart, setCart] = usePersistedState('scudo-cart', [])
  const [cartOpen, setCartOpen] = useState(false)
  const [order, setOrder] = usePersistedState('scudo-last-order', null)
  useEffect(() => { document.title = path === '/' ? 'Scudo Clothing — Football-inspired streetwear' : `${path.replace('/', '').replaceAll('/', ' / ')} — Scudo Clothing` }, [route, path])
  const toggleWishlist = (id) => setWishlist((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  const addToCart = (product, size, color, quantity = 1) => { const key = `${product.id}-${size}-${color}`; setCart((current) => { const existing = current.find((item) => item.key === key); return existing ? current.map((item) => item.key === key ? { ...item, quantity: item.quantity + quantity } : item) : [...current, { key, product, size, color, quantity }] }); setCartOpen(true) }
  const updateQuantity = (key, quantity) => setCart((current) => quantity < 1 ? current.filter((item) => item.key !== key) : current.map((item) => item.key === key ? { ...item, quantity } : item))
  const removeCartItem = (key) => setCart((current) => current.filter((item) => item.key !== key))
  const quickAdd = (product) => { if (!product.isSoldOut) addToCart(product, product.sizes[0], product.colors[0], 1) }
  const placeOrder = (data) => { const nextOrder = { ...data, number: `SC-${Date.now().toString().slice(-6)}` }; setOrder(nextOrder); setCart([]); navigate('/order-confirmation') }
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  let content
  if (path === '/') content = <HomePage wishlist={wishlist} onToggleWishlist={toggleWishlist} onQuickAdd={quickAdd} />
  else if (path === '/shop') content = <ShopPage wishlist={wishlist} onToggleWishlist={toggleWishlist} onQuickAdd={quickAdd} />
  else if (path === '/shop/jerseys') content = <ShopPage initialCategory="Jerseys" wishlist={wishlist} onToggleWishlist={toggleWishlist} onQuickAdd={quickAdd} />
  else if (path === '/shop/t-shirts') content = <ShopPage initialCategory="T-Shirts" wishlist={wishlist} onToggleWishlist={toggleWishlist} onQuickAdd={quickAdd} />
  else if (path.startsWith('/product/')) content = <ProductPage product={products.find((item) => item.slug === path.split('/').pop()) || products[0]} wishlist={wishlist} onToggleWishlist={toggleWishlist} onAddToCart={addToCart} />
  else if (path === '/collections') content = <CollectionsPage />
  else if (path === '/about') content = <InfoPage type="about" />
  else if (path === '/size-guide') content = <InfoPage type="size-guide" />
  else if (path === '/shipping-returns') content = <InfoPage type="shipping-returns" />
  else if (path === '/contact') content = <InfoPage type="contact" />
  else if (path === '/privacy') content = <InfoPage type="privacy" />
  else if (path === '/terms') content = <InfoPage type="terms" />
  else if (path === '/wishlist') content = <WishlistPage wishlist={wishlist} onToggleWishlist={toggleWishlist} onQuickAdd={quickAdd} />
  else if (path === '/cart') content = <CartPage cart={cart} onUpdateQuantity={updateQuantity} onRemove={removeCartItem} onCheckout={() => navigate('/checkout')} />
  else if (path === '/checkout') content = <CheckoutPage cart={cart} onPlaceOrder={placeOrder} />
  else if (path === '/order-confirmation') content = <OrderConfirmation order={order} />
  else if (path === '/account') content = <AccountPage />
  else if (path === '/admin') content = <AdminPage />
  else content = <InfoPage type="about" />
  return <div className="app"><Header cartCount={cartCount} wishlistCount={wishlist.length} onCartOpen={() => setCartOpen(true)} />{content}<Footer /><CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} onUpdateQuantity={updateQuantity} onRemove={removeCartItem} onCheckout={() => { setCartOpen(false); navigate('/checkout') }} /></div>
}
