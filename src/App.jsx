import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { products } from './productCatalog.js'
import { payWithRazorpay } from './razorpay.js'
import { authenticateWithEmail, firebaseAuthErrorMessage, signInWithGoogle, signOutFirebase, watchFirebaseAuth } from './firebaseAuth.js'

const catalogImages = (slug, count) => Array.from({ length: count }, (_, index) => `/catalog/${slug}/${String(index + 1).padStart(2, '0')}.webp`)
const catalogVariant = (src, width) => src.replace(/\.webp$/, `-${width}.webp`)

function CatalogImage({ src, sizes = '100vw', ...props }) {
  const isCatalogImage = typeof src === 'string' && src.startsWith('/catalog/')
  return <img
    src={src}
    srcSet={isCatalogImage ? `${catalogVariant(src, 480)} 480w, ${catalogVariant(src, 960)} 960w, ${src} 1600w` : undefined}
    sizes={isCatalogImage ? sizes : undefined}
    decoding="async"
    {...props}
  />
}

const categoryHeroImages = {
  bestsellers: '/category-heroes/bestsellers.jpg',
  'new-arrivals': '/category-heroes/new-arrivals.jpg',
  'shop-all': '/category-heroes/shop-all.jpg',
  'master-version': '/category-heroes/master-version.jpg',
  'player-version': '/category-heroes/player-version.jpg',
  'affordable-kits': '/category-heroes/affordable-kits.jpg'
}

const collections = [
  { title: 'Master Version', eyebrow: '01 / Matchday standard', copy: 'Detailed builds for the full ninety.', image: categoryHeroImages['master-version'], path: '/shop?edit=master-version', tone: 'ink' },
  { title: 'Player Version', eyebrow: '02 / Lightweight', copy: 'Athletic cuts made for movement.', image: categoryHeroImages['player-version'], path: '/shop?edit=player-version', tone: 'sand' },
  { title: 'Affordable Kits', eyebrow: '03 / Easy rotation', copy: 'Strong shirts at an easier price.', image: categoryHeroImages['affordable-kits'], path: '/shop?edit=affordable-kits', tone: 'cream' }
]

const menuCards = [
  { label: 'Bestsellers', path: '/shop?edit=bestsellers', image: categoryHeroImages.bestsellers },
  { label: 'New arrivals', path: '/shop?edit=new-arrivals', image: categoryHeroImages['new-arrivals'] },
  { label: 'Shop all', path: '/shop', image: categoryHeroImages['shop-all'] }
]

const menuCategories = [
  { label: 'Bestsellers', path: '/shop?edit=bestsellers', note: 'The starting XI' },
  { label: 'New arrivals', path: '/shop?edit=new-arrivals', note: 'Just in' },
  { label: 'Shop all', path: '/shop', note: 'The full rotation' },
  { label: 'Master version', path: '/shop?edit=master-version', note: 'Matchday standard' },
  { label: 'Player version', path: '/shop?edit=player-version', note: 'Lightweight energy' },
  { label: 'Affordable kits', path: '/shop?edit=affordable-kits', note: 'Easy on the wallet' }
]

const catalogEditLabels = {
  bestsellers: 'Bestsellers',
  'new-arrivals': 'New arrivals',
  'master-version': 'Master version',
  'player-version': 'Player version',
  'affordable-kits': 'Affordable kits'
}

const formatMoney = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

const socialLinks = [
  { name: 'Instagram', handle: '@scudoclothings', href: 'https://www.instagram.com/scudoclothings/', icon: 'instagram' },
  { name: 'X', handle: '@scudoclothings', href: 'https://x.com/scudoclothings', icon: 'x' },
  { name: 'Facebook', handle: '@scudoclothings', href: 'https://www.facebook.com/scudoclothings', icon: 'facebook' },
  { name: 'Email', handle: 'scudoclothing@gmail.com', href: 'mailto:scudoclothing@gmail.com', icon: 'mail' },
  { name: 'YouTube', handle: '@scudoclothings', href: 'https://www.youtube.com/@scudoclothings', icon: 'youtube' }
]

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
    x: <><path d="M5 4 19 20" /><path d="M19 4 5 20" /></>,
    facebook: <path d="M14 21v-8h3l.6-4H14V7c0-1.2.5-2 2.2-2H18V1.5c-.8-.1-1.8-.2-2.8-.2C12 1.3 10 3.2 10 6.7V9H7v4h3v8h4Z" fill="currentColor" stroke="none" />,
    mail: <><rect x="3" y="5" width="18" height="14" rx="1" /><path d="m4 7 8 6 8-6" /></>,
    youtube: <><rect x="2.5" y="5" width="19" height="14" rx="4" /><path d="m10 9 5 3-5 3Z" fill="currentColor" stroke="none" /></>,
    back: <><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></>
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function GoogleIcon() {
  return <svg className="google-auth-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.24-.2-1.79H12v3.48h5.52a4.72 4.72 0 0 1-2.05 3.09v2.26h3.32c1.94-1.79 2.81-4.42 2.81-7.04Z" /><path fill="#34A853" d="M12 22c2.7 0 4.96-.89 6.61-2.42l-3.32-2.57c-.89.6-2.03.96-3.29.96-2.6 0-4.81-1.76-5.6-4.13H2.98v2.64A10 10 0 0 0 12 22Z" /><path fill="#FBBC05" d="M6.4 13.84A6 6 0 0 1 6.08 12c0-.64.11-1.26.32-1.84V7.52H2.98A10 10 0 0 0 2 12c0 1.61.38 3.13.98 4.48l3.42-2.64Z" /><path fill="#EA4335" d="M12 6.03c1.47 0 2.78.5 3.82 1.49l2.87-2.87A9.65 9.65 0 0 0 12 2a10 10 0 0 0-9.02 5.52l3.42 2.64C7.19 7.79 9.4 6.03 12 6.03Z" /></svg>
}

export function ScudoLogo({ size = 'md', variant = 'reference', showSubtitle = true, showShadow = true, primaryColor, accentColor, className = '', mode = 'stacked' }) {
  const maskId = `scudo-shirt-${useId().replace(/:/g, '')}`
  const light = variant === 'light'
  const monochrome = variant === 'monochrome'
  const reference = variant === 'reference'
  const markOnly = mode === 'mark' || mode === 'favicon'
  const sOnly = mode === 's'
  const horizontal = mode === 'horizontal'
  const style = {
    '--logo-primary': primaryColor || (reference || light ? '#FFFFFF' : '#111111'),
    '--logo-accent': accentColor || (reference ? '#111314' : monochrome ? (light ? '#F7F4EE' : '#111111') : '#B9A889'),
    '--logo-field': reference ? '#BCAD89' : 'transparent'
  }
  return (
    <div className={`scudo-logo scudo-logo--${size} scudo-logo--${variant} ${horizontal ? 'scudo-logo--horizontal' : ''} ${markOnly ? 'scudo-logo--mark-only' : ''} ${sOnly ? 'scudo-logo--s-only' : ''} ${showShadow ? 'has-logo-shadow' : ''} ${className}`} style={style} aria-label="Scudo Clothing" role="img">
      {!sOnly && <svg className="scudo-logo__shirt" viewBox="0 0 240 190" aria-hidden="true" focusable="false"><title>Scudo Clothing shirt mark</title><defs><mask id={maskId}><rect width="240" height="190" fill="white" /><path d="M130 23C143 38 158 45 180 43C170 59 145 58 130 23Z" fill="black" /></mask></defs><path className="scudo-logo__shirt-fill" d="M49 36 133 21C144 33 160 41 180 41L229 89 197 124 171 108 148 184 54 155 78 75 40 68Z" fill="var(--logo-accent)" mask={`url(#${maskId})`} /><path className="scudo-logo__shirt-outline" d="M49 36 133 21C144 33 160 41 180 41L229 89 197 124 171 108 148 184 54 155 78 75 40 68Z" fill="none" stroke="var(--logo-accent)" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" mask={`url(#${maskId})`} /></svg>}
      {sOnly && <span className="scudo-logo__s">S</span>}
      {!markOnly && !sOnly && <div className="scudo-logo__word" aria-hidden="true">{['s', 'c', 'u', 'd', 'o'].map((letter, index) => <span key={`${letter}-${index}`} className={`scudo-logo__letter scudo-logo__letter--${letter}`} style={{ '--letter-index': index }}>{letter}</span>)}</div>}
      {showSubtitle && !markOnly && !sOnly && <div className="scudo-logo__subtitle">CLOTHINGS</div>}
    </div>
  )
}

function BrandIntro({ onComplete }) {
  const [phase, setPhase] = useState('preparing')
  const [leaving, setLeaving] = useState(false)
  const timers = useRef([])
  const finished = useRef(false)

  const complete = () => {
    if (finished.current) return
    finished.current = true
    document.body.classList.remove('intro-active')
    onComplete()
  }

  const skip = () => {
    timers.current.forEach(window.clearTimeout)
    setPhase('skipped')
    setLeaving(true)
    timers.current = [window.setTimeout(complete, 740)]
  }

  useEffect(() => {
    try { sessionStorage.setItem('scudo-intro-seen', '1') } catch {}
    document.body.classList.add('intro-active')
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let cancelled = false
    const start = async () => {
      try {
        await Promise.race([
          document.fonts?.load('900 116px "Scudo Recoleta"') || Promise.resolve(),
          new Promise((resolve) => window.setTimeout(resolve, 280))
        ])
      } catch {}
      if (cancelled) return
      window.requestAnimationFrame(() => setPhase('active'))
      if (reducedMotion) {
        timers.current = [
          window.setTimeout(() => setLeaving(true), 80),
          window.setTimeout(complete, 220)
        ]
        return
      }
      timers.current = [
        window.setTimeout(() => setPhase('completing'), 2320),
        window.setTimeout(() => setLeaving(true), 2860),
        window.setTimeout(complete, 3580)
      ]
    }
    start()
    return () => {
      cancelled = true
      timers.current.forEach(window.clearTimeout)
      document.body.classList.remove('intro-active')
    }
  }, [])
  return <div className={`brand-intro brand-intro--${phase} ${leaving ? 'brand-intro--leaving' : ''}`} role="dialog" aria-modal="true" aria-label="Scudo Clothing brand introduction">
    <span className="brand-intro__wash" aria-hidden="true" />
    <div className="brand-intro__lockup"><ScudoLogo size="md" showSubtitle showShadow className="brand-intro__logo" /><span className="brand-intro__sweep" aria-hidden="true" /></div>
    <button className="brand-intro__skip" type="button" onClick={skip}>Skip intro <Icon name="arrow" size={14} /></button>
  </div>
}

function usePersistedState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? initialValue } catch { return initialValue }
  })
  useEffect(() => { localStorage.setItem(key, JSON.stringify(value)) }, [key, value])
  return [value, setValue]
}

function useOverlayFocus(active, onClose) {
  const panelRef = useRef(null)
  const closeRef = useRef(onClose)
  const previousFocus = useRef(null)
  closeRef.current = onClose

  useEffect(() => {
    if (!active) return undefined
    previousFocus.current = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const panel = panelRef.current
    const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    const focusables = () => [...(panel?.querySelectorAll(focusableSelector) || [])]
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRef.current?.()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusables()
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.requestAnimationFrame(() => focusables()[0]?.focus())
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus.current?.focus?.()
    }
  }, [active])

  return panelRef
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

function useMotionSystem(route) {
  useEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const root = document.documentElement
    const motionSelector = '.hero-copy, .hero-visual, .campaign-ticker, .section-heading, .campaign-product-lead, .campaign-product-side, .product-card, .editorial-image-section, .collection-card, .story-image, .story-copy, .benefit, .shop-heading, .shop-toolbar, .shop-results, .product-gallery, .gallery-tile, .product-info, .product-lower, .related-section, .collection-feature, .info-hero, .info-sections section, .account-card, .checkout-heading, .checkout-form, .order-summary, .confirmation-card, .admin-header, .admin-stats > div, .admin-panel'
    const updateScrollState = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      const progress = maxScroll > 0 ? Math.min(1, window.scrollY / maxScroll) : 0
      document.body.classList.toggle('has-scrolled', window.scrollY > 18)
      root.style.setProperty('--scroll-progress', progress.toString())
    }

    updateScrollState()
    window.addEventListener('scroll', updateScrollState, { passive: true })
    document.body.classList.add('motion-ready')

    const elements = [...document.querySelectorAll(motionSelector)]
    elements.forEach((element, index) => {
      element.classList.add('motion-reveal')
      element.style.setProperty('--motion-delay', `${Math.min(index % 8, 7) * 55}ms`)
      if (element.matches('.hero-visual, .story-image, .collection-card, .collection-feature')) element.classList.add('motion-reveal--media')
    })

    let observer
    if (reducedMotion || !('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-revealed'))
    } else {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed')
            observer.unobserve(entry.target)
          }
        })
      }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' })
      elements.forEach((element) => observer.observe(element))
    }

    const heroVisual = document.querySelector('.hero-visual')
    const finePointer = window.matchMedia?.('(pointer: fine)').matches
    const onHeroPointer = (event) => {
      if (!heroVisual || reducedMotion || !finePointer) return
      const bounds = heroVisual.getBoundingClientRect()
      const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * -12
      const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -8
      heroVisual.style.setProperty('--parallax-x', `${x.toFixed(2)}px`)
      heroVisual.style.setProperty('--parallax-y', `${y.toFixed(2)}px`)
    }
    const resetHeroPointer = () => {
      heroVisual?.style.setProperty('--parallax-x', '0px')
      heroVisual?.style.setProperty('--parallax-y', '0px')
    }
    heroVisual?.addEventListener('pointermove', onHeroPointer)
    heroVisual?.addEventListener('pointerleave', resetHeroPointer)

    return () => {
      window.removeEventListener('scroll', updateScrollState)
      observer?.disconnect()
      heroVisual?.removeEventListener('pointermove', onHeroPointer)
      heroVisual?.removeEventListener('pointerleave', resetHeroPointer)
    }
  }, [route])
}

function navigate(path) {
  if (path === window.location.pathname + window.location.search) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  document.body.classList.add('is-routing')
  const commit = () => {
    window.history.pushState({}, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  window.setTimeout(() => {
    if (!reducedMotion && document.startViewTransition) {
      const transition = document.startViewTransition(commit)
      transition.finished.finally(() => document.body.classList.remove('is-routing'))
      return
    }
    commit()
    window.setTimeout(() => document.body.classList.remove('is-routing'), reducedMotion ? 30 : 380)
  }, reducedMotion ? 0 : 140)
}

function Link({ to, children, className = '', onClick, ...props }) {
  return <a href={to} className={className} onClick={(event) => { if (!props.target) { event.preventDefault(); navigate(to) } onClick?.(event) }} {...props}>{children}</a>
}

function Header({ cartCount, wishlistCount, onCartOpen, account }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const menuRef = useOverlayFocus(menuOpen, () => setMenuOpen(false))
  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === 'Escape') { setMenuOpen(false); setAccountMenuOpen(false) } }
    const closeAccountOnOutside = (event) => { if (!event.target.closest?.('.account-menu-shell')) setAccountMenuOpen(false) }
    window.addEventListener('keydown', closeOnEscape)
    document.addEventListener('pointerdown', closeAccountOnOutside)
    document.body.classList.toggle('menu-open', menuOpen)
    return () => { window.removeEventListener('keydown', closeOnEscape); document.removeEventListener('pointerdown', closeAccountOnOutside); document.body.classList.remove('menu-open') }
  }, [menuOpen])
  const closeMenu = () => setMenuOpen(false)
  return <>
    <header className="site-header">
      <div className="header-inner">
        <button className="icon-button mobile-menu-button" onClick={() => setMenuOpen(true)} aria-label="Open categories menu"><Icon name="menu" /></button>
        <nav className="desktop-nav" aria-label="Primary navigation"><Link to="/shop?edit=bestsellers">Bestsellers</Link><Link to="/shop?edit=new-arrivals">New arrivals</Link><Link to="/shop">Shop all</Link><Link to="/collections">Collections</Link><Link to="/about">About</Link></nav>
        <Link to="/" className="header-logo"><ScudoLogo size="sm" showSubtitle /></Link>
        <div className="header-actions">
          <Link to="/shop" className="icon-button" aria-label="Search"><Icon name="search" /></Link>
          {account ? <span className="account-menu-shell"><button className={`icon-button header-account account-trigger ${accountMenuOpen ? 'is-open' : ''}`} onClick={() => setAccountMenuOpen((open) => !open)} aria-label={`Account menu for ${account.name}`} aria-haspopup="menu" aria-expanded={accountMenuOpen}><Icon name="user" /><span className="account-status-dot" /></button>{accountMenuOpen && <nav className="account-popover" aria-label="Account navigation" role="menu"><div className="account-popover__intro"><span className="eyebrow">Signed in as</span><strong>{account.name}</strong></div><Link to="/orders" role="menuitem" onClick={() => setAccountMenuOpen(false)}><span>Your orders</span><Icon name="arrow" size={15} /></Link><Link to="/settings" role="menuitem" onClick={() => setAccountMenuOpen(false)}><span>Settings</span><Icon name="arrow" size={15} /></Link><Link to="/contact" role="menuitem" onClick={() => setAccountMenuOpen(false)}><span>Support</span><Icon name="arrow" size={15} /></Link></nav>}</span> : <Link to="/account" className="icon-button header-account" aria-label="Account"><Icon name="user" /></Link>}
          <Link to="/wishlist" className="icon-button with-count" aria-label={`Wishlist, ${wishlistCount} items`}><Icon name="heart" />{wishlistCount > 0 && <span>{wishlistCount}</span>}</Link>
          <button className="icon-button with-count" onClick={onCartOpen} aria-label={`Shopping bag, ${cartCount} items`}><Icon name="bag" />{cartCount > 0 && <span>{cartCount}</span>}</button>
        </div>
      </div>
    </header>
    {menuOpen && <div className="mobile-menu-overlay" onClick={closeMenu}><aside className="mobile-drawer" ref={menuRef} onClick={(event) => event.stopPropagation()} aria-label="Categories menu"><div className="drawer-top"><button className="drawer-close" onClick={closeMenu} aria-label="Close categories menu"><Icon name="close" /></button><span className="drawer-title">Categories</span><span className="drawer-top-spacer" /></div><div className="menu-featured" aria-label="Featured collections">{menuCards.map((card) => <Link key={card.label} to={card.path} onClick={closeMenu} aria-label={card.label}><div className="menu-featured__image"><CatalogImage src={card.image} alt="" sizes="160px" loading="eager" /></div></Link>)}</div><div className="menu-section-label">Scudo / Categories</div><nav className="category-nav" aria-label="Scudo categories">{menuCategories.map((item) => <Link key={item.label} to={item.path} onClick={closeMenu}><span><strong>{item.label}</strong><small>{item.note}</small></span><Icon name="arrow" size={18} /></Link>)}</nav><div className="drawer-secondary"><Link to="/shop/jerseys" onClick={closeMenu}>Jerseys</Link><Link to="/shop/t-shirts" onClick={closeMenu}>T-shirts</Link><Link to="/collections" onClick={closeMenu}>Collections</Link><Link to="/about" onClick={closeMenu}>About</Link></div><div className="drawer-account-links"><Link to={account ? '/orders' : '/account'} onClick={closeMenu}>{account ? 'Your orders' : 'Log in / Sign up'} <Icon name="arrow" size={15} /></Link><Link to="/wishlist" onClick={closeMenu}>Wishlist {wishlistCount > 0 && `(${wishlistCount})`} <Icon name="heart" size={15} /></Link>{account && <Link to="/settings" onClick={closeMenu}>Settings <Icon name="arrow" size={15} /></Link>}</div><div className="mobile-menu-footer"><Link to="/size-guide" onClick={closeMenu}>Size guide</Link><Link to="/shipping-final-sale" onClick={closeMenu}>Shipping & final sale</Link><Link to="/contact" onClick={closeMenu}>Contact</Link></div></aside></div>}
  </>
}

function Footer() {
  return <footer className="site-footer">
    <div className="footer-top">
      <div className="footer-brand">
        <ScudoLogo variant="reference" size="sm" />
        <p>Football-inspired pieces for the 90 minutes and everything after.</p>
        <div className="socials" aria-label="Scudo Clothing social media">
          {socialLinks.map((social) => <a key={social.name} href={social.href} target={social.name === 'Email' ? undefined : '_blank'} rel={social.name === 'Email' ? undefined : 'noreferrer'} aria-label={`${social.name}: ${social.handle}`} title={`${social.name} — ${social.handle}`}><Icon name={social.icon} /></a>)}
        </div>
      </div>
      <div className="footer-links">
        <div><p className="footer-label">Shop</p><Link to="/shop">All pieces</Link><Link to="/shop/jerseys">Jerseys</Link><Link to="/shop/t-shirts">T-shirts</Link><Link to="/collections">Collections</Link></div>
        <div><p className="footer-label">Customer care</p><Link to="/size-guide">Size guide</Link><Link to="/shipping-final-sale">Shipping & final sale</Link><Link to="/contact">Contact</Link><Link to="/account">Account</Link></div>
      </div>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} Scudo Clothing</span><div><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/about">About us</Link></div><span>Made for movement.</span></div>
  </footer>
}

function ProductCardLegacy({ product, onQuickAdd, wishlist, onToggleWishlist }) {
  const isWished = wishlist.includes(product.id)
  return <article className="product-card"><div className="product-image-wrap"><Link to={`/product/${product.slug}`} className="product-image-link"><img src={product.images[0]} alt={`${product.name} — ${product.shortDescription}`} loading="lazy" /><span className="product-status">{product.isSoldOut ? 'Sold out' : product.isNew ? 'New' : product.salePrice ? 'Sale' : 'Available'}</span></Link><WishlistButton active={isWished} onClick={() => onToggleWishlist(product.id)} /><button className="quick-add" onClick={() => onQuickAdd(product)} disabled={product.isSoldOut}>{product.isSoldOut ? 'Sold out' : 'Quick add'}<Icon name="plus" size={15} /></button></div><div className="product-meta"><Link to={`/product/${product.slug}`} className="product-name">{product.name}</Link><div className="product-price">{product.salePrice ? <><span className="sale-price">{formatMoney(product.salePrice)}</span><span className="was-price">{formatMoney(product.price)}</span></> : formatMoney(product.price)}</div><div className="product-detail-line"><span>{product.colors.join(' / ')}</span><span>{product.sizes.length} sizes</span></div></div></article>
}

function ProductCard({ product, onQuickAdd, wishlist, onToggleWishlist }) {
  const isWished = wishlist.includes(product.id)
  const [feedback, setFeedback] = useState('idle')
  const quickAdd = () => {
    const result = onQuickAdd(product)
    setFeedback(result === 'auth-required' ? 'signin' : 'added')
    window.setTimeout(() => setFeedback('idle'), 1300)
  }
  const feedbackClass = feedback === 'idle' ? '' : `is-${feedback}`
  return <article className="product-card"><div className="product-image-wrap"><Link to={`/product/${product.slug}`} className="product-image-link"><CatalogImage className="product-image-main" src={product.images[0]} alt={`${product.name} product image`} sizes="(max-width: 740px) 50vw, (max-width: 1000px) 33vw, 25vw" loading="lazy" /><span className="product-status">{product.isSoldOut ? 'Sold out' : product.isNew ? 'New' : product.salePrice ? 'Sale' : 'Available'}</span></Link><WishlistButton active={isWished} onClick={() => onToggleWishlist(product.id)} /><button className={`quick-add ${feedbackClass}`} onClick={quickAdd} disabled={product.isSoldOut}>{product.isSoldOut ? 'Sold out' : feedback === 'added' ? 'Added to bag' : feedback === 'signin' ? 'Sign in required' : 'Quick add'}<Icon name={feedback === 'added' ? 'check' : 'plus'} size={15} /></button></div><div className="product-meta"><Link to={`/product/${product.slug}`} className="product-name">{product.name}</Link><div className="product-price">{product.salePrice ? <><span className="sale-price">{formatMoney(product.salePrice)}</span><span className="was-price">{formatMoney(product.price)}</span></> : formatMoney(product.price)}</div><div className="product-detail-line"><span>{product.colors.join(' / ')}</span><span>{product.sizes.length} sizes</span></div></div></article>
}

function WishlistButtonLegacy({ active, onClick }) { return <button className={`wishlist-button ${active ? 'is-active' : ''}`} onClick={onClick} aria-label={active ? 'Remove from wishlist' : 'Add to wishlist'}><Icon name="heart" size={17} /></button> }

function WishlistButton({ active, onClick }) {
  const [bumping, setBumping] = useState(false)
  const toggle = () => { setBumping(true); onClick(); window.setTimeout(() => setBumping(false), 480) }
  return <button className={`wishlist-button ${active ? 'is-active' : ''} ${bumping ? 'is-bumping' : ''}`} onClick={toggle} aria-label={active ? 'Remove from wishlist' : 'Add to wishlist'}><Icon name="heart" size={17} /></button>
}

function Breadcrumbs({ items }) { return <div className="breadcrumbs"><Link to="/">Home</Link><span>/</span>{items.map((item, index) => <span key={index} className={index === items.length - 1 ? 'current' : ''}>{item.path ? <Link to={item.path}>{item.label}</Link> : item.label}</span>)}</div> }

function SectionHeading({ eyebrow, title, copy, action }) { return <div className="section-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>{copy && <p>{copy}</p>}{action}</div> }

function HomePage({ wishlist, onToggleWishlist, onQuickAdd }) {
  const campaignProducts = ['portugal-black-special', 'real-madrid-home'].map((id) => products.find((product) => product.id === id)).filter(Boolean)
  const [heroIndex, setHeroIndex] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const interval = window.setInterval(() => { if (!document.hidden) setHeroIndex((index) => (index + 1) % campaignProducts.length) }, 5600)
    return () => window.clearInterval(interval)
  }, [campaignProducts.length])
  const heroProduct = campaignProducts[heroIndex] || products[0]
  const tickerItems = ['Master version', 'Player version', 'Affordable kits', 'International shirts', 'Made for after full time']
  return <main className="home-page">
    <section className="hero hero--campaign">
      <div className="hero-copy">
        <div className="hero-kicker"><span>Scudo / Matchday edit</span><i /></div>
        <h1 className="hero-armour-title" aria-label="Armour for everyday">
          <span className="hero-line"><span>Armour</span></span>
          <span className="hero-line"><span>for <em>everyday.</em></span></span>
        </h1>
        <p className="hero-deck">Two iconic shirts, selected for the match and everything that follows.</p>
        <div className="button-row"><Link to="/shop/jerseys" className="button button-ghost hero-shop-button">Explore all shirts <Icon name="arrow" size={17} /></Link></div>
        <div className="hero-meta" aria-label="Collection details"><span>02 curated shirts</span><span>Drop 01 / 2026</span><span>Final sale</span></div>
      </div>
      <div className={`hero-visual hero-visual--${heroProduct.id}`}>
        <span className="hero-stage-label">The matchday rotation</span>
        <CatalogImage key={heroProduct.id} src={heroProduct.images[0]} alt={`${heroProduct.name} product image`} sizes="(max-width: 740px) 100vw, 56vw" loading="eager" fetchPriority="high" />
        <div className="hero-stamp"><span>{String(heroIndex + 1).padStart(2, '0')}</span><span>/ {String(campaignProducts.length).padStart(2, '0')}</span></div>
        <button className="hero-next" type="button" onClick={() => setHeroIndex((current) => (current + 1) % campaignProducts.length)} aria-label="Show next campaign product"><Icon name="arrow" size={20} /></button>
        <div className="hero-selector" aria-label="Campaign products">{campaignProducts.map((product, index) => <button key={product.id} className={heroIndex === index ? 'is-active' : ''} onClick={() => setHeroIndex(index)} aria-label={`Show ${product.name}`} aria-pressed={heroIndex === index}><span>{String(index + 1).padStart(2, '0')}</span><i /></button>)}</div>
      </div>
    </section>
    <section className="campaign-ticker" aria-label="Scudo clothing edits"><div className="campaign-ticker__track">{[0, 1].map((copy) => <div key={copy} aria-hidden={copy === 1}>{tickerItems.map((item) => <span key={`${copy}-${item}`}>{item}<i>✦</i></span>)}</div>)}</div></section>
    <section className="section shop-all-section" aria-labelledby="shop-all-title">
      <div className="shop-all-heading">
        <div><span className="eyebrow">The full rotation</span><h2 id="shop-all-title">Shop all</h2></div>
      </div>
      <div className="shop-all-grid">{products.map((product, index) => <div className="shop-all-grid__item" key={product.id} style={{ '--reveal-index': index }}><ProductCard product={product} onQuickAdd={onQuickAdd} wishlist={wishlist} onToggleWishlist={onToggleWishlist} /></div>)}</div>
    </section>
    <section className="editorial-image-section" aria-label="Armour for everyday campaign">
      <img src="/editorial/armour-for-everyday.png" alt="Scudo Armour for Everyday campaign featuring a black football shirt and the message More than a jersey, it is matchday culture" width="1844" height="576" loading="lazy" decoding="async" />
    </section>
    <section className="section collection-section"><SectionHeading title="Collections" /><div className="collection-grid">{collections.map((collection) => <Link to={collection.path} className={`collection-card collection-card--${collection.tone}`} key={collection.title}><CatalogImage src={collection.image} alt={`${collection.title} collection`} sizes="(max-width: 740px) 80vw, 33vw" loading="lazy" /><div className="collection-overlay"><span className="eyebrow">{collection.eyebrow}</span><h3>{collection.title}</h3><span className="collection-copy">{collection.copy}</span><span className="circle-link circle-link--small"><Icon name="arrow" size={17} /></span></div></Link>)}</div></section>
    <section className="story-section"><div className="story-image"><CatalogImage src={products.find((product) => product.id === 'france-away')?.images[3]} alt="France away jersey editorial detail" sizes="(max-width: 740px) 100vw, 55vw" loading="lazy" /></div><div className="story-copy"><span className="eyebrow">The Scudo idea</span><h2>Not a kit.<br /><em>A point of view.</em></h2><p>Scudo Clothing brings the codes of football into the everyday — considered fabrics, easy silhouettes, and the confidence to wear your colours your way.</p><Link to="/about" className="text-link">Read our story <Icon name="arrow" size={15} /></Link><div className="story-aside"><span>01</span><span>Football culture,<br />translated for daily life.</span></div></div></section>
    <section className="benefits-section"><div className="benefit-intro"><span className="eyebrow">The fine print</span><h2>Good pieces<br /><em>make good days.</em></h2></div><div className="benefit-grid">{[['01', 'Quality-first pieces', 'Thoughtful materials, made to be worn often.'], ['02', 'Comfortable everyday fit', 'Relaxed proportions for movement beyond the pitch.'], ['03', 'Limited-release collections', 'Small runs, considered drops, no unnecessary noise.'], ['04', 'Final-sale policy', 'All purchases are final. Please confirm your size before ordering.']].map(([number, title, copy]) => <div className="benefit" key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></div>)}</div></section>
  </main>
}

function ShopPage({ wishlist, onToggleWishlist, onQuickAdd, initialCategory }) {
  const params = new URLSearchParams(window.location.search)
  const edit = params.get('edit')
  const pageTitle = initialCategory || catalogEditLabels[edit] || 'Shop all'
  const [sort, setSort] = useState(params.get('sort') || 'featured')
  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesEdit = !edit || product.edits?.includes(edit)
    const matchesCategory = !initialCategory || product.category === initialCategory
    return matchesEdit && matchesCategory
  }).sort((a, b) => sort === 'newest' ? Number(b.isNew) - Number(a.isNew) : sort === 'price-low' ? (a.salePrice || a.price) - (b.salePrice || b.price) : sort === 'price-high' ? (b.salePrice || b.price) - (a.salePrice || a.price) : Number(b.isFeatured) - Number(a.isFeatured)), [initialCategory, sort, edit])
  return <main className="shop-page"><div className="page-shell"><Breadcrumbs items={[{ label: pageTitle }]} />
    <div className="shop-heading"><div><span className="eyebrow">{edit ? 'Curated team sheet' : initialCategory ? `${initialCategory} rotation` : 'The full rotation'}</span><h1>{pageTitle}</h1></div><p>Official Scudo product photography, organised for quick discovery.</p></div>
    <div className="shop-toolbar"><span className="product-count">{visibleProducts.length} pieces</span><div className="sort-select"><label htmlFor="sort">Sort by</label><select id="sort" value={sort} onChange={(e) => setSort(e.target.value)}><option value="featured">Featured</option><option value="newest">Newest</option><option value="price-low">Price low to high</option><option value="price-high">Price high to low</option></select><Icon name="chevron" size={14} /></div></div><div className="shop-results shop-results--full">{visibleProducts.length ? <div className="product-grid product-grid--three">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} onQuickAdd={onQuickAdd} wishlist={wishlist} onToggleWishlist={onToggleWishlist} />)}</div> : <EmptyState title="Nothing in this rotation" copy="This edit is being prepared. Explore the full collection in the meantime." action={<Link to="/shop" className="button button-dark">Shop all pieces</Link>} />}</div></div></main>
}

function EmptyState({ title, copy, action }) { return <div className="empty-state"><div className="empty-mark">SC</div><span className="eyebrow">Nothing here yet</span><h2>{title}</h2><p>{copy}</p>{action}</div> }

function ProductGallery({ product }) {
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const total = product.images.length
  const previousImage = () => setLightboxIndex((index) => (index - 1 + total) % total)
  const nextImage = () => setLightboxIndex((index) => (index + 1) % total)

  useEffect(() => {
    if (lightboxIndex === null) return undefined
    const previousOverflow = document.body.style.overflow
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setLightboxIndex(null)
      if (event.key === 'ArrowLeft') previousImage()
      if (event.key === 'ArrowRight') nextImage()
    }
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [lightboxIndex, total])

  return <>
    <div className="product-gallery">
      <div className="product-gallery__header"><span>Image archive</span><span>{String(total).padStart(2, '0')} product views</span></div>
      <div className="product-gallery__grid">
        {product.images.map((src, index) => <button type="button" className="gallery-tile" key={src} onClick={() => setLightboxIndex(index)} aria-label={`Open ${product.name} image ${index + 1} of ${total}`}>
          <CatalogImage src={src} alt={`${product.name} view ${index + 1}`} sizes="(max-width: 740px) 88vw, 34vw" loading={index === 0 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : undefined} />
          <span className="gallery-tile__number">{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
          <span className="gallery-tile__zoom"><Icon name="plus" size={14} /> View</span>
        </button>)}
      </div>
      <span className="product-gallery__swipe-note">Swipe to explore all {total} views</span>
    </div>
    {lightboxIndex !== null && createPortal(<div className="image-lightbox" role="dialog" aria-modal="true" aria-label={`${product.name} image viewer`} onClick={() => setLightboxIndex(null)}>
      <button className="image-lightbox__close" type="button" onClick={() => setLightboxIndex(null)} aria-label="Close image viewer" autoFocus><Icon name="close" size={20} /></button>
      <button className="image-lightbox__nav image-lightbox__nav--prev" type="button" onClick={(event) => { event.stopPropagation(); previousImage() }} aria-label="Previous product image"><Icon name="back" size={20} /></button>
      <div className="image-lightbox__frame" onClick={(event) => event.stopPropagation()}>
        <div className="image-lightbox__stage"><CatalogImage key={product.images[lightboxIndex]} src={product.images[lightboxIndex]} alt={`${product.name} enlarged view ${lightboxIndex + 1}`} sizes="90vw" /></div>
        <div className="image-lightbox__caption"><div><span>{product.collection}</span><strong>{product.name}</strong></div><span>{String(lightboxIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span></div>
        <div className="image-lightbox__thumbs" aria-label="Choose product image">{product.images.map((src, index) => <button type="button" className={lightboxIndex === index ? 'is-active' : ''} key={src} onClick={() => setLightboxIndex(index)} aria-label={`Show image ${index + 1}`}><CatalogImage src={src} alt="" sizes="72px" loading="lazy" /></button>)}</div>
      </div>
      <button className="image-lightbox__nav image-lightbox__nav--next" type="button" onClick={(event) => { event.stopPropagation(); nextImage() }} aria-label="Next product image"><Icon name="arrow" size={20} /></button>
    </div>, document.body)}
  </>
}

function ProductPage({ product, wishlist, onToggleWishlist, onAddToCart }) {
  const [size, setSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [reviewSent, setReviewSent] = useState(false)
  const [addState, setAddState] = useState('idle')
  const wished = wishlist.includes(product.id)
  const add = () => {
    if (!size) {
      setAddState('attention')
      window.setTimeout(() => setAddState('idle'), 600)
      return
    }
    setAddState('adding')
    const result = onAddToCart(product, size, product.colors[0], quantity)
    window.setTimeout(() => setAddState(result === 'auth-required' ? 'signin' : 'added'), 360)
    window.setTimeout(() => setAddState('idle'), 1700)
  }
  useEffect(() => { const button = document.querySelector('.add-to-bag'); if (button) button.dataset.status = addState }, [addState])
  return <main className="product-page"><div className="page-shell"><Breadcrumbs items={[{ label: product.category, path: `/shop/${product.category.toLowerCase().replace(' ', '-')}` }, { label: product.name }]} /><div className="product-detail"><ProductGallery product={product} /><div className="product-info"><span className="eyebrow">{product.collection} / {product.category}</span><h1>{product.name}</h1><div className="detail-price">{product.salePrice ? <><span className="sale-price">{formatMoney(product.salePrice)}</span><span className="was-price">{formatMoney(product.price)}</span></> : formatMoney(product.price)} <span className="tax-note">incl. taxes</span></div><p className="detail-description">{product.description}</p><div className="selector-block"><div className="selector-label"><span>Size</span><Link to="/size-guide">Size guide <Icon name="arrow" size={13} /></Link></div><div className="size-grid">{product.sizes.map((item) => <button key={item} className={size === item ? 'is-selected' : ''} onClick={() => setSize(item)}>{item}</button>)}</div>{!size && <span className="selection-note">Select a size to add this piece.</span>}</div><div className="add-row"><div className="quantity-control"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity"><Icon name="minus" size={15} /></button><span>{quantity}</span><button onClick={() => setQuantity(Math.min(product.inventory || 1, quantity + 1))} aria-label="Increase quantity"><Icon name="plus" size={15} /></button></div><button className="button button-dark add-to-bag" onClick={add} disabled={!size || product.isSoldOut}>{product.isSoldOut ? 'Sold out' : !size ? 'Select a size' : 'Add to bag'} <Icon name="arrow" size={16} /></button><button className={`icon-button detail-wishlist ${wished ? 'is-active' : ''}`} onClick={() => onToggleWishlist(product.id)} aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}><Icon name="heart" /></button></div><div className="detail-notes"><div><span>Shipping</span><p>Ships in 2–4 business days across India.</p></div><div><span>Final sale</span><p>All purchases are final. Returns are not accepted.</p></div><div><span>Details</span><p>{product.material}. {product.careInstructions}</p></div></div></div></div><section className="product-lower"><div><span className="eyebrow">Reviews / 03</span><h2>Worn in the wild.</h2></div><div className="review-content"><div className="review-card"><div className="stars">★★★★★</div><p>“Good weight, easy fit. It’s become the jersey I reach for even when there isn’t a game on.”</p><span>— A. Mehta / Verified buyer</span></div><form className="review-form" onSubmit={(event) => { event.preventDefault(); setReviewSent(true) }}><span className="form-title">Leave a review</span><input required placeholder="Your name" aria-label="Your name" /><textarea required placeholder="What did you think?" aria-label="Your review" rows="3" /><button className="button button-ghost" type="submit">{reviewSent ? 'Review submitted' : 'Submit review'}</button></form></div></section><section className="section related-section"><SectionHeading eyebrow="Complete the rotation" title="You may also like" /><div className="product-grid product-grid--four">{products.filter((item) => item.id !== product.id).slice(0, 4).map((item) => <ProductCard key={item.id} product={item} onQuickAdd={(p) => onAddToCart(p, p.sizes[0], p.colors[0], 1)} wishlist={wishlist} onToggleWishlist={onToggleWishlist} />)}</div></section></div></main>
}

function CartDrawer({ open, onClose, cart, onUpdateQuantity, onRemove, onCheckout }) {
  const drawerRef = useOverlayFocus(open, onClose)
  const subtotal = cart.reduce((total, item) => total + (item.product.salePrice || item.product.price) * item.quantity, 0)
  return open ? <div className="drawer-overlay" onClick={onClose}><aside className="cart-drawer" ref={drawerRef} onClick={(event) => event.stopPropagation()} aria-label="Shopping bag"><div className="drawer-head"><div><span className="eyebrow">Your rotation</span><h2>Shopping bag <small>{cart.reduce((a, i) => a + i.quantity, 0)}</small></h2></div><button className="icon-button" onClick={onClose} aria-label="Close shopping bag"><Icon name="close" /></button></div>{cart.length ? <><div className="drawer-items">{cart.map((item) => <CartLine key={`${item.product.id}-${item.size}-${item.color}`} item={item} onUpdateQuantity={onUpdateQuantity} onRemove={onRemove} compact />)}</div><div className="drawer-summary"><div><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div><p>Shipping calculated at checkout. All purchases are final; no returns are accepted.</p><button className="button button-dark" onClick={onCheckout}>Go to checkout <Icon name="arrow" size={16} /></button><Link to="/cart" className="text-link" onClick={onClose}>View bag</Link></div></> : <EmptyState title="Your bag is empty" copy="Add a piece and it will show up here." action={<Link to="/shop" className="button button-dark" onClick={onClose}>Shop the rotation</Link>} />}</aside></div> : null
}

function CartLine({ item, onUpdateQuantity, onRemove, compact = false }) { const price = item.product.salePrice || item.product.price; return <div className={`cart-line ${compact ? 'cart-line--compact' : ''}`}><CatalogImage src={item.product.images[0]} alt={item.product.name} sizes="155px" /><div className="cart-line-info"><Link to={`/product/${item.product.slug}`}>{item.product.name}</Link><span>{item.color} / {item.size}</span><strong>{formatMoney(price * item.quantity)}</strong><div className="mini-quantity"><button onClick={() => onUpdateQuantity(item.key, item.quantity - 1)} aria-label="Decrease quantity"><Icon name="minus" size={12} /></button><span>{item.quantity}</span><button onClick={() => onUpdateQuantity(item.key, item.quantity + 1)} aria-label="Increase quantity"><Icon name="plus" size={12} /></button></div></div><button className="remove-line" onClick={() => onRemove(item.key)} aria-label={`Remove ${item.product.name}`}><Icon name="close" size={15} /></button></div> }

function CartPage({ cart, onUpdateQuantity, onRemove, onCheckout }) {
  const subtotal = cart.reduce((total, item) => total + (item.product.salePrice || item.product.price) * item.quantity, 0)
  const shipping = subtotal >= 3500 || subtotal === 0 ? 0 : 150
  const tax = Math.round(subtotal * 0.05)
  return <main className="cart-page"><div className="page-shell"><Breadcrumbs items={[{ label: 'Shopping bag' }]} /><div className="cart-heading"><div><span className="eyebrow">Review your rotation</span><h1>Shopping bag</h1></div>{cart.length > 0 && <span>{cart.reduce((a, i) => a + i.quantity, 0)} pieces</span>}</div>{cart.length ? <div className="cart-layout"><div className="cart-items">{cart.map((item) => <CartLine key={item.key} item={item} onUpdateQuantity={onUpdateQuantity} onRemove={onRemove} />)}<Link to="/shop" className="text-link back-link"><Icon name="back" size={15} /> Continue shopping</Link></div><OrderSummary subtotal={subtotal} shipping={shipping} tax={tax} onCheckout={onCheckout} /></div> : <EmptyState title="No pieces yet" copy="Your bag is waiting for its first addition." action={<Link to="/shop" className="button button-dark">Shop the rotation</Link>} />}</div></main>
}

function OrderSummary({ subtotal, shipping, tax, onCheckout, checkoutLabel = 'Checkout', disabled = false }) { return <aside className="order-summary"><span className="eyebrow">Summary</span><h2>Matchday total</h2><div className="summary-lines"><div><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div><div><span>Shipping</span><strong>{shipping ? formatMoney(shipping) : 'Complimentary'}</strong></div><div><span>Estimated tax</span><strong>{formatMoney(tax)}</strong></div></div><div className="summary-total"><span>Total</span><strong>{formatMoney(subtotal + shipping + tax)}</strong></div><button className="button button-dark" type="button" onClick={onCheckout} disabled={!subtotal || disabled}>{checkoutLabel} <Icon name="arrow" size={16} /></button><p className="secure-note">Totals are verified on our server · payments secured by Razorpay · all sales final.</p></aside> }

function CheckoutPage({ cart, onPlaceOrder }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: '', state: '', country: 'India', postal: '', terms: false })
  const [error, setError] = useState('')
  const [stage, setStage] = useState('idle')
  const paymentLock = useRef(false)
  const placing = stage !== 'idle'
  const subtotal = cart.reduce((total, item) => total + (item.product.salePrice || item.product.price) * item.quantity, 0)
  const shipping = subtotal >= 3500 || subtotal === 0 ? 0 : 150
  const tax = Math.round(subtotal * 0.05)
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  useEffect(() => { const button = document.querySelector('.place-order'); if (button) button.dataset.status = placing ? 'processing' : 'idle' }, [placing])
  const buttonLabel = stage === 'creating' ? 'Creating secure order…' : stage === 'awaiting' ? 'Complete payment in Razorpay…' : stage === 'verifying' ? 'Verifying payment…' : 'Pay securely with Razorpay'
  const validateAndPlace = async () => {
    if (paymentLock.current || placing) return
    if (!form.terms) return setError('Please accept the terms, final-sale policy, and privacy policy to continue.')
    if (!form.name || !form.email || !form.phone || !form.address || !form.city || !form.state || !form.postal) return setError('Please complete all required delivery details.')
    setError('')
    paymentLock.current = true
    try {
      const verification = await payWithRazorpay({ cart, customer: form, termsAccepted: form.terms, onStage: setStage })
      onPlaceOrder({
        number: verification.order.receipt,
        city: form.city,
        country: form.country,
        total: verification.order.amount / 100,
        items: cart,
        payment: { provider: 'Razorpay', orderId: verification.order.orderId, paymentId: verification.order.paymentId, status: verification.paid ? 'Paid' : 'Processing' }
      })
    } catch (paymentError) {
      paymentLock.current = false
      setError(paymentError?.message || 'Secure payment could not be completed. Please try again.')
      setStage('idle')
    }
  }
  const submit = (event) => { event.preventDefault(); validateAndPlace() }
  return <main className="checkout-page"><div className="page-shell"><Breadcrumbs items={[{ label: 'Checkout' }]} /><div className="checkout-heading"><span className="eyebrow">Secure Razorpay checkout</span><h1>Ready when you are.</h1><p>Your total is recalculated on our server before Razorpay opens. Scudo never receives or stores your card, UPI PIN, or banking credentials.</p></div>{!cart.length ? <EmptyState title="Your bag is empty" copy="Add something before checking out." action={<Link to="/shop" className="button button-dark">Shop the rotation</Link>} /> : <form className="checkout-layout" onSubmit={submit}><div className="checkout-form"><FormSection title="Contact"><div className="form-grid"><Field label="Full name" value={form.name} onChange={(v) => update('name', v)} required autoComplete="name" /><Field label="Email address" type="email" value={form.email} onChange={(v) => update('email', v)} required autoComplete="email" /><Field label="Phone number" type="tel" value={form.phone} onChange={(v) => update('phone', v)} required autoComplete="tel" /></div></FormSection><FormSection title="Delivery address"><div className="form-grid"><Field label="Address" value={form.address} onChange={(v) => update('address', v)} required wide autoComplete="street-address" /><Field label="City" value={form.city} onChange={(v) => update('city', v)} required autoComplete="address-level2" /><Field label="State" value={form.state} onChange={(v) => update('state', v)} required autoComplete="address-level1" /><Field label="Country" value={form.country} onChange={(v) => update('country', v)} required autoComplete="country-name" /><Field label="Postal code" value={form.postal} onChange={(v) => update('postal', v)} required autoComplete="postal-code" /></div></FormSection><FormSection title="Payment"><div className="payment-note payment-note--secure"><span className="payment-badge">RAZORPAY</span><p><strong>Choose UPI, card, wallet, or net banking securely in Razorpay Checkout.</strong><br />Payment is accepted only after server-side signature and captured-status verification.</p></div></FormSection><label className="checkbox-row"><input type="checkbox" checked={form.terms} onChange={(e) => update('terms', e.target.checked)} /><span>I agree to the <Link to="/terms">terms and final-sale policy</Link> and <Link to="/privacy">privacy policy</Link>.</span></label>{error && <p className="form-error form-error--block" role="alert">{error}</p>}<button className="button button-dark place-order" type="submit" disabled={placing} aria-busy={placing}>{buttonLabel} <Icon name="arrow" size={16} /></button></div><OrderSummary subtotal={subtotal} shipping={shipping} tax={tax} checkoutLabel={buttonLabel} onCheckout={validateAndPlace} disabled={placing} /></form>}</div></main>
}

function FormSection({ title, children }) { return <section className="form-section"><h2>{title}</h2>{children}</section> }
function Field({ label, type = 'text', value, onChange, required, wide, autoComplete }) { return <label className={`field ${wide ? 'field--wide' : ''}`}><span>{label}{required && ' *'}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} autoComplete={autoComplete} /></label> }

function OrderConfirmation({ order }) { const paid = order?.payment?.status === 'Paid'; const processing = order?.payment?.status === 'Processing'; return <main className="confirmation-page"><div className="confirmation-card"><div className="confirmation-mark"><Icon name={paid ? 'check' : 'chevron'} size={26} /></div><span className="eyebrow">Order received / {order?.number || 'SC-PENDING'}</span><h1>{paid ? 'Payment confirmed.' : 'Payment received.'}</h1><p>{paid ? 'Razorpay verified and captured your payment securely.' : processing ? 'Your payment signature is verified and Razorpay is completing capture. Do not submit another payment for this order.' : 'Your order is being reviewed.'} All purchases are final and no returns are accepted.</p><div className="confirmation-meta"><div><span>Payment status</span><strong>{order?.payment?.status || 'Processing'}</strong></div><div><span>Estimated delivery</span><strong>2–4 business days after capture</strong></div><div><span>Ship to</span><strong>{order?.city || 'Your city'}, {order?.country || 'India'}</strong></div></div><Link to="/shop" className="button button-dark">Continue shopping <Icon name="arrow" size={16} /></Link></div></main> }

function WishlistPage({ wishlist, onToggleWishlist, onQuickAdd }) { const wished = products.filter((product) => wishlist.includes(product.id)); return <main className="shop-page wishlist-page"><div className="page-shell"><Breadcrumbs items={[{ label: 'Wishlist' }]} /><div className="shop-heading"><div><span className="eyebrow">Saved for later</span><h1>Your wishlist</h1></div><p>{wished.length ? `${wished.length} pieces saved.` : 'Keep the good ones close.'}</p></div>{wished.length ? <div className="product-grid product-grid--four">{wished.map((product) => <ProductCard key={product.id} product={product} onQuickAdd={onQuickAdd} wishlist={wishlist} onToggleWishlist={onToggleWishlist} />)}</div> : <EmptyState title="Your list is quiet" copy="Tap the heart on a piece to save it for later." action={<Link to="/shop" className="button button-dark">Shop the rotation</Link>} />}</div></main> }

function CollectionsPage() { return <main className="collections-page"><div className="page-shell"><Breadcrumbs items={[{ label: 'Collections' }]} /><div className="shop-heading"><div><span className="eyebrow">The edit</span><h1>Collections</h1></div><p>Different moods, one point of view.</p></div><div className="collection-list">{collections.map((collection, index) => <Link to={collection.path} className={`collection-feature collection-feature--${collection.tone}`} key={collection.title}><CatalogImage src={collection.image} alt={`${collection.title} collection`} sizes="(max-width: 740px) 100vw, 50vw" loading="lazy" /><div><span className="eyebrow">{collection.eyebrow}</span><h2>{collection.title}</h2><p>{collection.copy}</p><span className="text-link">Explore collection <Icon name="arrow" size={15} /></span></div><span className="collection-number">0{index + 1}</span></Link>)}</div></div></main> }

function ContactChannels() {
  return <section className="contact-channels" aria-label="Connect with Scudo Clothing">
    <div className="contact-channels__heading"><span className="eyebrow">Follow the rotation</span><h2>Find Scudo everywhere.</h2></div>
    <div className="contact-channels__grid">{socialLinks.map((social) => <a key={social.name} href={social.href} target={social.name === 'Email' ? undefined : '_blank'} rel={social.name === 'Email' ? undefined : 'noreferrer'}><span className="contact-channels__icon"><Icon name={social.icon} size={19} /></span><span><strong>{social.name}</strong><small>{social.handle}</small></span><Icon name="arrow" size={15} /></a>)}</div>
  </section>
}

function StorePolicyPage({ type }) {
  const isTerms = type === 'terms'
  const sections = isTerms
    ? [
        ['Orders', 'An order is confirmed after the configured payment provider accepts it and the order details are verified.'],
        ['Final sale & support', 'All purchases are final and are not eligible for return. Contact scudoclothing@gmail.com for delivery or order support.']
      ]
    : [
        ['Shipping', 'Orders ship across India in 2–4 business days. You’ll receive tracking details once your order leaves us. Shipping costs are calculated at checkout.'],
        ['Final-sale policy', 'All purchases are final. We do not accept returns. Please review the product details and size guide carefully before ordering.']
      ]
  return <main className="info-page"><div className="page-shell"><Breadcrumbs items={[{ label: isTerms ? 'Terms' : 'Shipping & final sale' }]} /><div className="info-hero"><span className="eyebrow">{isTerms ? 'Legal / Terms' : 'Customer care'}</span><h1>{isTerms ? <>The ground<br /><em>rules.</em></> : <>Shipping &<br /><em>final sale.</em></>}</h1><p>{isTerms ? 'These store terms explain the order and final-sale conditions.' : 'Please review your order and confirm your size carefully before completing your purchase.'}</p></div><div className="info-sections">{sections.map(([title, copy]) => <section key={title}><span className="eyebrow">{title}</span><p>{copy}</p></section>)}</div></div></main>
}

function InfoPage({ type }) {
  if (type === 'shipping-final-sale' || type === 'terms') return <StorePolicyPage type={type} />
  const content = { about: { eyebrow: 'The Scudo idea', title: <>Not a kit.<br /><em>A point of view.</em></>, intro: 'Scudo Clothing is a football-inspired streetwear label for people who see the game as more than a scoreline.', sections: [['The 90 minutes and everything after', 'We make pieces for the full day around the game — the walk to the stadium, the first coffee, the late train home, and every ordinary moment in between.'], ['Our first team sheet', 'Scudo starts with small, considered drops: relaxed shapes, familiar colours, and details that feel lived-in from the first wear. The goal is simple — build an everyday rotation that carries a little matchday energy.']] }, 'size-guide': { eyebrow: 'Find your fit', title: <>The right<br /><em>formation.</em></>, intro: 'Our fits are designed with room to move. Take your usual size for an easy fit, or size down for a closer silhouette.', sections: [['T-shirts & jerseys', 'Measure around the chest at the fullest point. Compare with the chart below. Jerseys are designed to feel relaxed.'], ['Size guide', 'S — 36–38 in chest · M — 39–41 in chest · L — 42–44 in chest · XL — 45–47 in chest · XXL — 48–50 in chest']] }, 'shipping-final-sale': { eyebrow: 'Customer care', title: <>Shipping &<br /><em>final sale.</em></>, intro: 'Please review your order and confirm your size carefully before completing your purchase.', sections: [['Shipping', 'Orders ship across India in 2–4 business days. You’ll receive tracking details once your order leaves us. Shipping costs are calculated at checkout.'], ['Final-sale policy', 'All purchases are final. We do not accept returns. Please review the product details and size guide carefully before ordering.']] }, contact: { eyebrow: 'Say hello', title: <>Over to<br /><em>you.</em></>, intro: 'Questions about a piece, a fit, or a future drop? The line is open.', sections: [['Email', 'scudoclothing@gmail.com'], ['Hours', 'Monday–Friday, 10:00–18:00 IST. We aim to reply within two business days.']] }, privacy: { eyebrow: 'Legal / Privacy', title: <>Your data,<br /><em>handled lightly.</em></>, intro: 'This starter policy page is intentionally concise and should be reviewed with your legal advisor before launch.', sections: [['What we collect', 'We collect the details needed to process an order, provide support, and send updates when you choose to subscribe. We do not store raw card information.'], ['Your choices', 'Email scudoclothing@gmail.com to ask about access, correction, or deletion of personal information.']] }, terms: { eyebrow: 'Legal / Terms', title: <>The ground<br /><em>rules.</em></>, intro: 'These store terms explain the order and final-sale conditions.', sections: [['Orders', 'An order is confirmed after the configured payment provider accepts it and the order details are verified.'], ['Final sale & support', 'All purchases are final and are not eligible for return. Contact scudoclothing@gmail.com for delivery or order support.']] } }[type]
  return <main className="info-page"><div className="page-shell"><Breadcrumbs items={[{ label: type === 'about' ? 'About' : type === 'size-guide' ? 'Size guide' : type === 'shipping-final-sale' ? 'Shipping & final sale' : 'Contact' }]} /><div className="info-hero"><span className="eyebrow">{content.eyebrow}</span><h1>{content.title}</h1><p>{content.intro}</p></div><div className="info-sections">{content.sections.map(([title, copy]) => <section key={title}><span className="eyebrow">{title}</span><p>{copy}</p></section>)}</div>{type === 'contact' && <ContactChannels />}{type === 'size-guide' && <div className="size-table"><div className="size-table-head"><span>Size</span><span>Chest</span><span>Length</span></div>{[['S','36–38 in','27 in'],['M','39–41 in','28 in'],['L','42–44 in','29 in'],['XL','45–47 in','30 in'],['XXL','48–50 in','31 in']].map((row) => <div className="size-table-row" key={row[0]}>{row.map((value) => <span key={value}>{value}</span>)}</div>)}</div>} {type === 'contact' && <a className="button button-dark" href="mailto:scudoclothing@gmail.com">Email the team <Icon name="arrow" size={16} /></a>}</div></main>
}

function AuthForm({ onSuccess, compact = false }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('idle')
  const submit = async (event) => {
    event.preventDefault()
    if (status !== 'idle') return
    if (mode === 'signup' && !name.trim()) return setError('Please enter your name.')
    if (!email.includes('@') || password.length < 6) return setError('Enter a valid email and a password of at least 6 characters.')
    setError('')
    setStatus('email')
    try {
      onSuccess(await authenticateWithEmail({ mode, name: name.trim(), email: email.trim().toLowerCase(), password }))
    } catch (emailError) {
      setError(firebaseAuthErrorMessage(emailError, 'email'))
      setStatus('idle')
    }
  }
  const googleSignIn = async () => {
    if (status !== 'idle') return
    setError('')
    setStatus('google')
    try {
      onSuccess(await signInWithGoogle())
    } catch (googleError) {
      setError(firebaseAuthErrorMessage(googleError))
      setStatus('idle')
    }
  }
  const switchMode = () => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setStatus('idle') }
  return <form className={`auth-form auth-form--${mode} ${compact ? 'auth-form--compact' : ''} ${error ? 'has-error' : ''} ${status !== 'idle' ? 'is-submitting' : ''}`} data-status={status} onSubmit={submit}><button className={`google-auth-button ${status === 'google' ? 'is-loading' : ''}`} type="button" onClick={googleSignIn} disabled={status !== 'idle'}><GoogleIcon /><span>{status === 'google' ? 'Connecting to Google...' : 'Continue with Google'}</span></button><div className="auth-divider"><span>or continue with email</span></div>{mode === 'signup' && <Field label="Full name" value={name} onChange={setName} autoComplete="name" required />}<Field label="Email address" type="email" value={email} onChange={setEmail} autoComplete="email" required /><Field label="Password" type="password" value={password} onChange={setPassword} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required />{error && <p className="form-error form-error--block">{error}</p>}<button className="button button-dark auth-submit" type="submit" disabled={status !== 'idle'}>{status === 'email' ? 'Checking...' : mode === 'login' ? 'Log in' : 'Create account'} <Icon name="arrow" size={16} /></button><button className="text-link account-toggle" type="button" onClick={switchMode} disabled={status !== 'idle'}>{mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Log in'}</button></form>
}

function AuthGate({ onClose, onAuthenticated }) {
  const panelRef = useOverlayFocus(true, onClose)
  return <div className="auth-gate-overlay" onClick={onClose}><aside className="auth-gate-card" ref={panelRef} onClick={(event) => event.stopPropagation()} aria-label="Sign in required"><button className="icon-button auth-gate-close" onClick={onClose} aria-label="Close login panel"><Icon name="close" /></button><ScudoLogo size="sm" showSubtitle={false} showShadow={false} /><span className="eyebrow">Members first</span><h2>Sign in to add<br /><em>to your bag.</em></h2><p>Create an account or log in to keep your rotation saved.</p><AuthForm onSuccess={onAuthenticated} compact /></aside></div>
}

function AccountPage({ account, onAuthenticate, onLogout }) {
  if (account) return <main className="account-page"><div className="account-card account-card--signed-in"><ScudoLogo size="sm" /><span className="eyebrow">Your Scudo account</span><h1>Welcome back, {account.name}.</h1><p className="account-email">{account.email}</p><button className="button button-ghost" onClick={onLogout}>Log out</button></div></main>
  return <main className="account-page"><div className="account-card"><ScudoLogo size="sm" /><span className="eyebrow">Welcome back</span><h1>Log in to your account.</h1><AuthForm onSuccess={onAuthenticate} /></div></main>
}

function OrdersPage({ account, order }) {
  if (!account) return <main className="account-page"><div className="account-card"><span className="eyebrow">Members first</span><h1>Log in to see your orders.</h1><p className="demo-note">Your order history will appear here after you sign in.</p><Link to="/account" className="button button-dark">Log in <Icon name="arrow" size={16} /></Link></div></main>
  return <main className="orders-page"><div className="page-shell"><Breadcrumbs items={[{ label: 'Your orders' }]} /><div className="account-page-heading"><span className="eyebrow">Your rotation</span><h1>Orders.</h1><p>Every piece you’ve added to the journey.</p></div>{order ? <article className="order-card"><div className="order-card__head"><div><span className="eyebrow">Order {order.number}</span><h2>{order.payment?.status === 'Paid' ? 'Payment verified.' : 'Payment processing.'}</h2></div><span className="status-pill">{order.payment?.status || 'Processing'}</span></div><div className="order-card__meta"><div><span>Date</span><strong>{new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN')}</strong></div><div><span>Ship to</span><strong>{order.city || 'Your city'}, {order.country || 'India'}</strong></div><div><span>Total</span><strong>{formatMoney(order.total || 0)}</strong></div></div><div className="order-card__items">{order.items?.map((item) => <div key={item.key || item.product.id}><img src={item.product.images[0]} alt="" /><div><strong>{item.product.name}</strong><span>{item.color} / {item.size} · Qty {item.quantity}</span></div><b>{formatMoney((item.product.salePrice || item.product.price) * item.quantity)}</b></div>)}</div></article> : <EmptyState title="No orders yet" copy="Your first Scudo order will appear here after checkout." action={<Link to="/shop" className="button button-dark">Shop the rotation <Icon name="arrow" size={16} /></Link>} />}</div></main>
}

function SettingsPage({ account }) {
  const [saved, setSaved] = useState(false)
  const [name, setName] = useState(account?.name || '')
  const [email, setEmail] = useState(account?.email || '')
  if (!account) return <main className="account-page"><div className="account-card"><span className="eyebrow">Members first</span><h1>Log in to manage settings.</h1><Link to="/account" className="button button-dark">Log in <Icon name="arrow" size={16} /></Link></div></main>
  return <main className="settings-page"><div className="page-shell"><Breadcrumbs items={[{ label: 'Settings' }]} /><div className="account-page-heading"><span className="eyebrow">Account preferences</span><h1>Settings.</h1><p>Keep your Scudo details current.</p></div><form className="settings-card" onSubmit={(event) => { event.preventDefault(); setSaved(true); window.setTimeout(() => setSaved(false), 1800) }}><label className="field"><span>Full name</span><input value={name} onChange={(event) => setName(event.target.value)} /></label><label className="field"><span>Email address</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><div className="settings-card__footer"><button className="button button-dark" type="submit">{saved ? 'Saved' : 'Save changes'} <Icon name={saved ? 'check' : 'arrow'} size={16} /></button></div></form></div></main>
}

function AdminPage() { const [authed, setAuthed] = usePersistedState('scudo-admin-auth', false); const [announcement, setAnnouncement] = usePersistedState('scudo-announcement', 'DROP 01 — THE FIRST XI'); const [saved, setSaved] = useState(false); if (!authed) return <main className="account-page"><div className="account-card"><span className="eyebrow">Store admin</span><h1>Keep the team sheet current.</h1><p>Protected demo foundation for catalog, inventory, content, and order operations.</p><button className="button button-dark" onClick={() => setAuthed(true)}>Enter demo dashboard <Icon name="arrow" size={16} /></button><p className="demo-note">Demo access only. Replace this gate with your auth provider before launch.</p></div></main>; return <main className="admin-page"><div className="page-shell"><div className="admin-header"><div><span className="eyebrow">Scudo / Store admin</span><h1>Good morning, manager.</h1></div><button className="button button-ghost" onClick={() => setAuthed(false)}>Log out</button></div><div className="admin-stats">{[['Live products', products.filter((p) => !p.isSoldOut).length, 'catalog'], ['Inventory value', formatMoney(products.reduce((sum, p) => sum + p.price * p.inventory, 0)), 'at retail'], ['Low stock', products.filter((p) => p.inventory > 0 && p.inventory < 8).length, 'needs a look'], ['Payment gateway', 'Razorpay', 'server verified']].map(([label, value, note]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>)}</div><div className="admin-grid"><section className="admin-panel"><div className="panel-heading"><div><span className="eyebrow">Content</span><h2>Announcement bar</h2></div><span className="status-pill">Live</span></div><p>Edit the message shown above the storefront header.</p><div className="admin-edit-row"><input value={announcement} onChange={(e) => { setAnnouncement(e.target.value); setSaved(false) }} /><button className="button button-dark" onClick={() => setSaved(true)}>Save</button></div>{saved && <span className="form-success">Saved to demo store.</span>}</section><section className="admin-panel"><div className="panel-heading"><div><span className="eyebrow">Catalog</span><h2>Products</h2></div><Link to="/shop" className="text-link">View storefront <Icon name="arrow" size={14} /></Link></div><div className="admin-products">{products.map((product) => <div key={product.id}><img src={product.images[0]} alt="" /><span>{product.name}<small>{product.sku}</small></span><strong className={product.inventory < 8 ? 'low-stock' : ''}>{product.isSoldOut ? 'Sold out' : `${product.inventory} in stock`}</strong><button className="icon-button" aria-label={`Edit ${product.name}`}><Icon name="chevron" size={15} /></button></div>)}</div></section><section className="admin-panel"><div className="panel-heading"><div><span className="eyebrow">Operations</span><h2>Next connections</h2></div></div><div className="admin-checklist">{['Product image storage', 'Razorpay secure payments', 'Supabase authentication', 'Payment capture webhooks'].map((item, i) => <div key={item}><span className={i !== 2 ? 'check is-done' : 'check'}>{i !== 2 && <Icon name="check" size={13} />}</span>{item}<span className="connection-status">{i === 2 ? 'Not configured' : i === 0 ? 'Ready for upload' : 'Configured in code'}</span></div>)}</div></section></div></div></main> }

export default function App() {
  const route = useRoute()
  const path = window.location.pathname
  useMotionSystem(route)
  const [showIntro, setShowIntro] = useState(() => {
    try { return new URLSearchParams(window.location.search).has('intro') || !sessionStorage.getItem('scudo-intro-seen') } catch { return true }
  })
  const [wishlist, setWishlist] = usePersistedState('scudo-wishlist', [])
  const [cart, setCart] = usePersistedState('scudo-cart', [])
  const [account, setAccount] = usePersistedState('scudo-account', null)
  const [cartOpen, setCartOpen] = useState(false)
  const [authPrompt, setAuthPrompt] = useState(false)
  const [pendingAdd, setPendingAdd] = useState(null)
  const [order, setOrder] = usePersistedState('scudo-last-order', null)
  useEffect(() => watchFirebaseAuth(setAccount), [setAccount])
  useEffect(() => { document.title = path === '/' ? 'Scudo Clothing — Football-inspired streetwear' : `${path.replace('/', '').replaceAll('/', ' / ')} — Scudo Clothing` }, [route, path])
  const toggleWishlist = (id) => setWishlist((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  const addToCartNow = (product, size, color, quantity = 1) => { const key = `${product.id}-${size}-${color}`; setCart((current) => { const existing = current.find((item) => item.key === key); return existing ? current.map((item) => item.key === key ? { ...item, quantity: item.quantity + quantity } : item) : [...current, { key, product, size, color, quantity }] }); setCartOpen(true); return 'added' }
  const addToCart = (product, size, color, quantity = 1) => { if (!account) { setPendingAdd({ product, size, color, quantity }); setAuthPrompt(true); return 'auth-required' }; return addToCartNow(product, size, color, quantity) }
  const authenticate = (profile) => { setAccount(profile); setAuthPrompt(false); if (pendingAdd) { addToCartNow(pendingAdd.product, pendingAdd.size, pendingAdd.color, pendingAdd.quantity); setPendingAdd(null) } }
  const logout = async () => { await signOutFirebase(); setAccount(null) }
  const closeAuthPrompt = () => { setAuthPrompt(false); setPendingAdd(null) }
  const updateQuantity = (key, quantity) => setCart((current) => quantity < 1 ? current.filter((item) => item.key !== key) : current.map((item) => item.key === key ? { ...item, quantity } : item))
  const removeCartItem = (key) => setCart((current) => current.filter((item) => item.key !== key))
  const quickAdd = (product) => { if (!product.isSoldOut) return addToCart(product, product.sizes[0], product.colors[0], 1); return 'sold-out' }
  const placeOrder = (data) => { const nextOrder = { ...data, number: data.number || `SC-${Date.now().toString().slice(-6)}`, createdAt: new Date().toISOString() }; setOrder(nextOrder); setCart([]); navigate('/order-confirmation') }
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
  else if (path === '/shipping-final-sale') content = <InfoPage type="shipping-final-sale" />
  else if (path === '/contact') content = <InfoPage type="contact" />
  else if (path === '/privacy') content = <InfoPage type="privacy" />
  else if (path === '/terms') content = <InfoPage type="terms" />
  else if (path === '/wishlist') content = <WishlistPage wishlist={wishlist} onToggleWishlist={toggleWishlist} onQuickAdd={quickAdd} />
  else if (path === '/cart') content = <CartPage cart={cart} onUpdateQuantity={updateQuantity} onRemove={removeCartItem} onCheckout={() => navigate('/checkout')} />
  else if (path === '/checkout') content = <CheckoutPage cart={cart} onPlaceOrder={placeOrder} />
  else if (path === '/order-confirmation') content = <OrderConfirmation order={order} />
  else if (path === '/account') content = <AccountPage account={account} onAuthenticate={authenticate} onLogout={logout} />
  else if (path === '/orders') content = <OrdersPage account={account} order={order} />
  else if (path === '/settings') content = <SettingsPage account={account} />
  else if (path === '/admin') content = <AdminPage />
  else content = <InfoPage type="about" />
  return <div className={`app ${showIntro ? 'app--intro' : ''}`}><span className="scroll-progress" aria-hidden="true" /><Header cartCount={cartCount} wishlistCount={wishlist.length} account={account} onCartOpen={() => setCartOpen(true)} />{content}<Footer /><CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} onUpdateQuantity={updateQuantity} onRemove={removeCartItem} onCheckout={() => { setCartOpen(false); navigate('/checkout') }} />{authPrompt && <AuthGate onClose={closeAuthPrompt} onAuthenticated={authenticate} />}{showIntro && <BrandIntro onComplete={() => setShowIntro(false)} />}</div>
}
