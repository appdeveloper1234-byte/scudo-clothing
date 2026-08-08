import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { products, replaceCatalogProducts } from './productCatalog.js'
import { loadStoreCatalog } from './catalogApi.js'
import { payWithRazorpay } from './razorpay.js'
import {
  authenticateWithEmail,
  firebaseAuthErrorMessage,
  sendFirebasePasswordReset,
  sendFirebaseVerificationEmail,
  signInWithGoogle,
  signOutFirebase,
  updateFirebaseProfile,
  watchFirebaseAuth
} from './firebaseAuth.js'
import {
  archiveAdminProduct,
  loadAdminCatalog,
  loadAdminDashboard,
  saveAdminProduct,
  updateAdminOrder,
  uploadAdminProductImage
} from './adminApi.js'
import {
  clearCustomerProfileCache,
  isCustomerProfileComplete,
  loadCustomerProfile,
  normalizeCustomerProfile,
  saveCustomerProfile,
  validateCustomerProfile
} from './customerProfile.js'

const catalogImages = (slug, count) => Array.from({ length: count }, (_, index) => `/catalog/${slug}/${String(index + 1).padStart(2, '0')}.webp`)
const catalogVariant = (src, width) => src.replace(/\.webp$/, `-${width}.webp`)

function CatalogImage({ src, sizes = '100vw', ...props }) {
  const hasResponsiveVariants = typeof src === 'string' && (src.startsWith('/catalog/') || src.startsWith('/shop-all-main/'))
  return <img
    src={src}
    srcSet={hasResponsiveVariants ? `${catalogVariant(src, 480)} 480w, ${catalogVariant(src, 960)} 960w, ${src} 1600w` : undefined}
    sizes={hasResponsiveVariants ? sizes : undefined}
    decoding="async"
    {...props}
  />
}

const categoryHeroImages = {
  bestsellers: '/category-heroes/bestsellers.jpg',
  'new-arrivals': '/category-heroes/new-arrivals.jpg',
  'shop-all': '/category-heroes/shop-all.jpg',
  'master-version': '/category-heroes/master-version.png',
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
const SHIPPING_CHARGE = 50
const categorySlug = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const socialLinks = [
  { name: 'WhatsApp', handle: '+91 87674 16351', href: 'https://wa.me/918767416351', icon: 'whatsapp' },
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
    whatsapp: <><path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.5L3.5 20.5l1.4-4.3a8.5 8.5 0 1 1 15.6-4.6Z" /><path d="M8.2 7.6c.2-.5.4-.5.8-.5h.4c.2 0 .4.1.5.4l.8 1.8c.1.3.1.5-.1.7l-.7.8c-.2.2-.1.4 0 .6.7 1.3 1.7 2.2 3 2.9.2.1.4.2.6 0l.9-1c.2-.2.4-.3.7-.2l1.8.9c.3.1.4.3.4.5 0 .4-.2 1.4-.8 1.9-.6.5-1.4.7-2.3.5-1.1-.2-2.7-.8-4.6-2.5-1.5-1.4-2.5-3-2.8-4.1-.3-1-.1-2 .4-2.7Z" /></>,
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
          document.fonts?.load('400 126px "Scudo Ahsing"', 'scudo') || Promise.resolve(),
          new Promise((resolve) => window.setTimeout(resolve, 1200))
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

function useRequiredProfileGuard(required) {
  useEffect(() => {
    if (!required) return undefined
    const lockedPath = window.location.pathname + window.location.search
    const lockedState = { ...(window.history.state || {}), scudoProfileRequired: true }
    window.history.replaceState(lockedState, '', lockedPath)
    window.history.pushState(lockedState, '', lockedPath)

    const keepSetupOpen = () => {
      window.history.pushState(lockedState, '', lockedPath)
    }
    window.addEventListener('popstate', keepSetupOpen)
    return () => window.removeEventListener('popstate', keepSetupOpen)
  }, [required])
}

function useMotionSystem(route) {
  useEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const root = document.documentElement
    const motionSelector = '.hero-copy, .hero-visual, .campaign-ticker, .section-heading, .campaign-product-lead, .campaign-product-side, .product-card, .editorial-image-section, .collection-card, .story-image, .story-copy, .benefit, .shop-heading, .shop-toolbar, .shop-results, .product-gallery, .gallery-tile, .product-info, .product-lower, .related-section, .collection-feature, .info-hero, .info-sections section, .about-story__section, .about-quote, .about-company, .account-card, .checkout-heading, .checkout-form, .order-summary, .confirmation-card, .admin-header, .admin-stats > div, .admin-panel'
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
          <Link to="/shop?focus=search" className="icon-button" aria-label="Search products"><Icon name="search" /></Link>
          {account ? <span className="account-menu-shell"><button className={`icon-button header-account account-trigger ${accountMenuOpen ? 'is-open' : ''}`} onClick={() => setAccountMenuOpen((open) => !open)} aria-label={`Account menu for ${account.name}`} aria-haspopup="menu" aria-expanded={accountMenuOpen}><Icon name="user" /><span className="account-status-dot" /></button>{accountMenuOpen && <nav className="account-popover" aria-label="Account navigation" role="menu"><div className="account-popover__intro"><span className="eyebrow">Signed in as</span><strong>{account.name}</strong></div><Link to="/orders" role="menuitem" onClick={() => setAccountMenuOpen(false)}><span>Your orders</span><Icon name="arrow" size={15} /></Link><Link to="/settings" role="menuitem" onClick={() => setAccountMenuOpen(false)}><span>Settings</span><Icon name="arrow" size={15} /></Link><Link to="/contact" role="menuitem" onClick={() => setAccountMenuOpen(false)}><span>Support</span><Icon name="arrow" size={15} /></Link></nav>}</span> : <Link to="/account" className="icon-button header-account" aria-label="Account"><Icon name="user" /></Link>}
          <Link to="/wishlist" className="icon-button with-count" aria-label={`Wishlist, ${wishlistCount} items`}><Icon name="heart" />{wishlistCount > 0 && <span>{wishlistCount}</span>}</Link>
          <button className="icon-button with-count" onClick={onCartOpen} aria-label={`Shopping bag, ${cartCount} items`}><Icon name="bag" />{cartCount > 0 && <span>{cartCount}</span>}</button>
        </div>
      </div>
    </header>
    {menuOpen && <div className="mobile-menu-overlay" onClick={closeMenu}><aside className="mobile-drawer" ref={menuRef} onClick={(event) => event.stopPropagation()} aria-label="Categories menu"><div className="drawer-top"><button className="drawer-close" onClick={closeMenu} aria-label="Close categories menu"><Icon name="close" /></button><span className="drawer-title">Categories</span><span className="drawer-top-spacer" /></div><div className="menu-featured" aria-label="Featured collections">{menuCards.map((card) => <Link key={card.label} to={card.path} onClick={closeMenu} aria-label={card.label}><div className="menu-featured__image"><CatalogImage src={card.image} alt="" sizes="160px" loading="eager" /></div></Link>)}</div><div className="menu-section-label">Scudo / Categories</div><nav className="category-nav" aria-label="Scudo categories">{menuCategories.map((item) => <Link key={item.label} to={item.path} onClick={closeMenu}><span><strong>{item.label}</strong><small>{item.note}</small></span><Icon name="arrow" size={18} /></Link>)}</nav><div className="drawer-secondary"><Link to="/shop/jerseys" onClick={closeMenu}>Jerseys</Link><Link to="/shop/t-shirts" onClick={closeMenu}>T-shirts</Link><Link to="/collections" onClick={closeMenu}>Collections</Link><Link to="/about" onClick={closeMenu}>About</Link></div><div className="drawer-account-links"><Link to={account ? '/orders' : '/account'} onClick={closeMenu}>{account ? 'Your orders' : 'Log in / Sign up'} <Icon name="arrow" size={15} /></Link><Link to="/wishlist" onClick={closeMenu}>Wishlist {wishlistCount > 0 && `(${wishlistCount})`} <Icon name="heart" size={15} /></Link>{account && <Link to="/settings" onClick={closeMenu}>Settings <Icon name="arrow" size={15} /></Link>}</div><div className="mobile-menu-footer"><Link to="/size-guide" onClick={closeMenu}>Size guide</Link><Link to="/shipping-final-sale" onClick={closeMenu}>Shipping & returns</Link><Link to="/returns" onClick={closeMenu}>Return policy</Link><Link to="/contact" onClick={closeMenu}>Contact</Link></div></aside></div>}
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
        <div><p className="footer-label">Customer care</p><Link to="/size-guide">Size guide</Link><Link to="/shipping-final-sale">Shipping & returns</Link><Link to="/returns">Return policy</Link><Link to="/contact">Contact</Link><Link to="/account">Account</Link></div>
      </div>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} Scudo Clothing</span><div><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/returns">Return policy</Link><Link to="/about">About us</Link></div><span>Made for movement.</span></div>
  </footer>
}

function ProductCard({ product, onQuickAdd, wishlist, onToggleWishlist }) {
  const isWished = wishlist.includes(product.id)
  const cardImage = product.shopImage || product.images[0]
  const [feedback, setFeedback] = useState('idle')
  const quickAdd = () => {
    const result = onQuickAdd(product)
    setFeedback(result === 'auth-required' ? 'signin' : 'added')
    window.setTimeout(() => setFeedback('idle'), 1300)
  }
  const feedbackClass = feedback === 'idle' ? '' : `is-${feedback}`
  return <article className="product-card"><div className="product-image-wrap"><Link to={`/product/${product.slug}`} className="product-image-link"><CatalogImage className="product-image-main" src={cardImage} alt={`${product.name} product image`} sizes="(max-width: 740px) 50vw, (max-width: 1000px) 33vw, 25vw" loading="lazy" /><span className="product-status">{product.isSoldOut ? 'Sold out' : product.isNew ? 'New' : product.salePrice ? 'Sale' : 'Available'}</span></Link><WishlistButton active={isWished} onClick={() => onToggleWishlist(product.id)} /><button className={`quick-add ${feedbackClass}`} onClick={quickAdd} disabled={product.isSoldOut}>{product.isSoldOut ? 'Sold out' : feedback === 'added' ? 'Added to bag' : feedback === 'signin' ? 'Sign in required' : 'Quick add'}<Icon name={feedback === 'added' ? 'check' : 'plus'} size={15} /></button></div><div className="product-meta"><Link to={`/product/${product.slug}`} className="product-name">{product.name}</Link><div className="product-price">{product.salePrice ? <><span className="sale-price">{formatMoney(product.salePrice)}</span><span className="was-price">{formatMoney(product.price)}</span></> : formatMoney(product.price)}</div><div className="product-detail-line"><span>{product.sizes.length} sizes</span></div></div></article>
}

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
    if (campaignProducts.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const interval = window.setInterval(() => { if (!document.hidden) setHeroIndex((index) => (index + 1) % campaignProducts.length) }, 3000)
    return () => window.clearInterval(interval)
  }, [campaignProducts.length])
  const heroProduct = campaignProducts[heroIndex] || products[0]
  const tickerItems = ['Master version', 'Player version', 'Affordable kits', 'International shirts', 'Made for after full time']
  return <main className="home-page">
    <section className="hero hero--campaign">
      <div className="hero-copy">
        <h1 className="hero-armour-title" aria-label="Armour for everyday">
          <span className="hero-line hero-line--primary"><span>Armour</span></span>
          <span className="hero-line hero-line--accent"><span><small>for</small><em>everyday.</em></span></span>
        </h1>
        <p className="hero-deck">Iconic shirts selected for the match, the walk home, and everything after the final whistle.</p>
        <div className="button-row"><Link to="/shop/jerseys" className="button hero-shop-button"><span>Explore all shirts</span><span className="hero-shop-button__icon"><Icon name="arrow" size={17} /></span></Link></div>
      </div>
      <div className={`hero-visual hero-visual--${heroProduct.id}`}>
        <CatalogImage key={heroProduct.id} src={heroProduct.images[0]} alt={`${heroProduct.name} product image`} sizes="(max-width: 740px) 100vw, 56vw" loading="eager" fetchPriority="high" />
      </div>
    </section>
    <section className="campaign-ticker" aria-label="Scudo clothing edits"><div className="campaign-ticker__track">{[0, 1].map((copy) => <div key={copy} aria-hidden={copy === 1}>{tickerItems.map((item) => <span key={`${copy}-${item}`}>{item}<i>✦</i></span>)}</div>)}</div></section>
    <section className="section shop-all-section" aria-labelledby="shop-all-title">
      <div className="shop-all-heading">
        <div><span className="eyebrow">The full rotation</span><h2 id="shop-all-title">Shop all</h2></div>
        <div className="shop-all-note"><strong>{String(products.length).padStart(2, '0')} pieces</strong><span>Current Scudo rotation<br />curated for everyday wear.</span></div>
      </div>
      <div className="shop-all-grid">{products.map((product, index) => <div className="shop-all-grid__item" key={product.id} style={{ '--reveal-index': index }}><ProductCard product={product} onQuickAdd={onQuickAdd} wishlist={wishlist} onToggleWishlist={onToggleWishlist} /></div>)}</div>
    </section>
    <section className="editorial-image-section" aria-label="Armour for everyday campaign">
      <img src="/editorial/armour-for-everyday.png" alt="Scudo Armour for Everyday campaign featuring a black football shirt and the message More than a jersey, it is matchday culture" width="1844" height="576" loading="lazy" decoding="async" />
    </section>
    <section className="section collection-section"><SectionHeading title="Collections" /><div className="collection-grid">{collections.map((collection) => <Link to={collection.path} className={`collection-card collection-card--${collection.tone}`} key={collection.title}><CatalogImage src={collection.image} alt={`${collection.title} collection`} sizes="(max-width: 740px) 80vw, 33vw" loading="lazy" /><div className="collection-overlay"><span className="eyebrow">{collection.eyebrow}</span><h3>{collection.title}</h3><span className="collection-copy">{collection.copy}</span><span className="circle-link circle-link--small"><Icon name="arrow" size={17} /></span></div></Link>)}</div></section>
    <section className="story-section"><div className="story-image"><CatalogImage src={products.find((product) => product.id === 'france-away')?.images[3]} alt="France away jersey editorial detail" sizes="(max-width: 740px) 100vw, 55vw" loading="lazy" /></div><div className="story-copy"><span className="eyebrow">The Scudo idea</span><h2>Not a kit.<br /><em>A point of view.</em></h2><p>Scudo Clothing brings the codes of football into the everyday — considered fabrics, easy silhouettes, and the confidence to wear your colours your way.</p><Link to="/about" className="text-link">Read our story <Icon name="arrow" size={15} /></Link><div className="story-aside"><span>01</span><span>Football culture,<br />translated for daily life.</span></div></div></section>
    <section className="benefits-section"><div className="benefit-intro"><span className="eyebrow">The fine print</span><h2>Good pieces<br /><em>make good days.</em></h2></div><div className="benefit-grid">{[['01', 'Quality-first pieces', 'Thoughtful materials, made to be worn often.'], ['02', 'Comfortable everyday fit', 'Relaxed proportions for movement beyond the pitch.'], ['03', 'Limited-release collections', 'Small runs, considered drops, no unnecessary noise.'], ['04', 'Verified-issue support', 'Report damaged, defective, incorrect, or missing items within 48 hours.']].map(([number, title, copy]) => <div className="benefit" key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></div>)}</div></section>
  </main>
}

function ShopPage({ wishlist, onToggleWishlist, onQuickAdd, initialCategory }) {
  const params = new URLSearchParams(window.location.search)
  const queryString = window.location.search
  const edit = params.get('edit')
  const pageTitle = initialCategory || catalogEditLabels[edit] || 'Shop all'
  const [sort, setSort] = useState(params.get('sort') || 'featured')
  const [search, setSearch] = useState(params.get('q') || '')
  const searchRef = useRef(null)
  useEffect(() => {
    if (params.get('focus') !== 'search') return undefined
    const timer = window.setTimeout(() => searchRef.current?.focus(), 280)
    return () => window.clearTimeout(timer)
  }, [queryString])
  const catalogKey = products.map((product) => `${product.id}:${product.updatedAt || ''}`).join('|')
  const catalogCategories = [...new Set(products.map((product) => product.category).filter(Boolean))].sort()
  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesEdit = !edit || product.edits?.includes(edit)
    const matchesCategory = !initialCategory || product.category === initialCategory
    const term = search.trim().toLowerCase()
    const matchesSearch = !term || [product.name, product.category, product.collection, product.shortDescription].filter(Boolean).join(' ').toLowerCase().includes(term)
    return matchesEdit && matchesCategory && matchesSearch
  }).sort((a, b) => sort === 'newest' ? Number(b.isNew) - Number(a.isNew) : sort === 'price-low' ? (a.salePrice || a.price) - (b.salePrice || b.price) : sort === 'price-high' ? (b.salePrice || b.price) - (a.salePrice || a.price) : Number(b.isFeatured) - Number(a.isFeatured)), [catalogKey, initialCategory, sort, edit, search])
  return <main className="shop-page"><div className="page-shell"><Breadcrumbs items={[{ label: pageTitle }]} />
    <div className="shop-heading"><div><span className="eyebrow">{edit ? 'Curated team sheet' : initialCategory ? `${initialCategory} rotation` : 'The full rotation'}</span><h1>{pageTitle}</h1></div><p>Official Scudo product photography, organised for quick discovery.</p></div>
    <nav className="catalog-category-tabs" aria-label="Shop by clothing category"><Link to="/shop" className={!initialCategory ? 'is-active' : ''}>All</Link>{catalogCategories.map((category) => <Link key={category} to={`/shop/${categorySlug(category)}`} className={initialCategory === category ? 'is-active' : ''}>{category}</Link>)}</nav>
    <div className="shop-toolbar shop-toolbar--search"><label className="catalog-search"><Icon name="search" size={16} /><span className="sr-only">Search products</span><input ref={searchRef} type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search shirts, teams, collections" autoComplete="off" />{search && <button type="button" onClick={() => { setSearch(''); searchRef.current?.focus() }} aria-label="Clear product search"><Icon name="close" size={14} /></button>}</label><span className="product-count" aria-live="polite">{visibleProducts.length} pieces</span><div className="sort-select"><label htmlFor="sort">Sort by</label><select id="sort" value={sort} onChange={(e) => setSort(e.target.value)}><option value="featured">Featured</option><option value="newest">Newest</option><option value="price-low">Price low to high</option><option value="price-high">Price high to low</option></select><Icon name="chevron" size={14} /></div></div><div className="shop-results shop-results--full">{visibleProducts.length ? <div className="product-grid product-grid--three">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} onQuickAdd={onQuickAdd} wishlist={wishlist} onToggleWishlist={onToggleWishlist} />)}</div> : <EmptyState title="No pieces match" copy={`No products match “${search}”. Try a team, category, or collection name.`} action={<button type="button" className="button button-dark" onClick={() => setSearch('')}>Clear search</button>} />}</div></div></main>
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
  const [addState, setAddState] = useState('idle')
  const wished = wishlist.includes(product.id)
  const maxQuantity = Math.max(1, Math.min(5, Number(product.inventory || 0)))

  useEffect(() => {
    setSize('')
    setQuantity(1)
  }, [product.id])

  useEffect(() => {
    const button = document.querySelector('.add-to-bag')
    if (button) button.dataset.status = addState
  }, [addState])

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

  const relatedProducts = products.filter((item) => item.id !== product.id).slice(0, 4)

  return <main className="product-page"><div className="page-shell">
    <Breadcrumbs items={[{ label: product.category, path: `/shop/${product.category.toLowerCase().replace(' ', '-')}` }, { label: product.name }]} />
    <div className="product-detail">
      <ProductGallery product={product} />
      <div className="product-info">
        <span className="eyebrow">{product.collection} / {product.category}</span>
        <h1>{product.name}</h1>
        <div className="detail-price">{product.salePrice ? <><span className="sale-price">{formatMoney(product.salePrice)}</span><span className="was-price">{formatMoney(product.price)}</span></> : formatMoney(product.price)}</div>
        <p className="detail-description">{product.description}</p>
        <div className="selector-block">
          <div className="selector-label"><span>Size</span><Link to="/size-guide">Size guide <Icon name="arrow" size={13} /></Link></div>
          <div className="size-grid">{product.sizes.map((item) => <button type="button" key={item} className={size === item ? 'is-selected' : ''} onClick={() => setSize(item)}>{item}</button>)}</div>
          {!size && <span className="selection-note">Select a size to add this piece.</span>}
        </div>
        <div className="add-row">
          <div className="quantity-control"><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity"><Icon name="minus" size={15} /></button><span>{quantity}</span><button type="button" onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))} disabled={quantity >= maxQuantity} aria-label="Increase quantity"><Icon name="plus" size={15} /></button></div>
          <button type="button" className="button button-dark add-to-bag" onClick={add} disabled={!size || product.isSoldOut}>{product.isSoldOut ? 'Sold out' : !size ? 'Select a size' : 'Add to bag'} <Icon name="arrow" size={16} /></button>
          <button type="button" className={`icon-button detail-wishlist ${wished ? 'is-active' : ''}`} onClick={() => onToggleWishlist(product.id)} aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}><Icon name="heart" /></button>
        </div>
        <div className="detail-notes"><div><span>Shipping</span><p>Flat ₹50 shipping. Ships in 4–15 business days across India.</p></div><div><span>Return policy</span><p>Verified damaged, defective, incorrect, or missing-item claims must be raised within 48 hours.</p></div><div><span>Details</span><p>{product.material}. {product.careInstructions}</p></div></div>
      </div>
    </div>
    <section className="product-lower product-assurance">
      <div><span className="eyebrow">Before you buy</span><h2>Right piece.<br />Right fit.</h2></div>
      <div className="review-content">
        <div className="review-card"><span className="eyebrow">Fit support</span><p>Compare the garment measurements before ordering. If you are between sizes, ask the Scudo team before checkout.</p><Link to="/size-guide" className="text-link">Open size guide <Icon name="arrow" size={14} /></Link></div>
        <div className="review-card"><span className="eyebrow">Order support</span><p>Need help with this piece, delivery, or an eligible product issue? Send the product name directly to our support team.</p><Link to="/contact" className="text-link">Contact support <Icon name="arrow" size={14} /></Link></div>
      </div>
    </section>
    <section className="section related-section"><SectionHeading eyebrow="Complete the rotation" title="You may also like" /><div className="product-grid product-grid--four">{relatedProducts.map((item) => <ProductCard key={item.id} product={item} onQuickAdd={(selectedProduct) => onAddToCart(selectedProduct, selectedProduct.sizes[0], selectedProduct.colors[0], 1)} wishlist={wishlist} onToggleWishlist={onToggleWishlist} />)}</div></section>
  </div></main>
}

function CartDrawer({ open, onClose, cart, onUpdateQuantity, onRemove, onCheckout }) {
  const drawerRef = useOverlayFocus(open, onClose)
  const subtotal = cart.reduce((total, item) => total + (item.product.salePrice || item.product.price) * item.quantity, 0)
  return open ? <div className="drawer-overlay" onClick={onClose}><aside className="cart-drawer" ref={drawerRef} onClick={(event) => event.stopPropagation()} aria-label="Shopping bag"><div className="drawer-head"><div><span className="eyebrow">Your rotation</span><h2>Shopping bag <small>{cart.reduce((a, i) => a + i.quantity, 0)}</small></h2></div><button className="icon-button" onClick={onClose} aria-label="Close shopping bag"><Icon name="close" /></button></div>{cart.length ? <><div className="drawer-items">{cart.map((item) => <CartLine key={`${item.product.id}-${item.size}-${item.color}`} item={item} onUpdateQuantity={onUpdateQuantity} onRemove={onRemove} compact />)}</div><div className="drawer-summary"><div><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div><p>Flat ₹50 shipping. Verified product or delivery issues must be reported within 48 hours.</p><button className="button button-dark" onClick={onCheckout}>Go to checkout <Icon name="arrow" size={16} /></button><Link to="/cart" className="text-link" onClick={onClose}>View bag</Link></div></> : <EmptyState title="Your bag is empty" copy="Add a piece and it will show up here." action={<Link to="/shop" className="button button-dark" onClick={onClose}>Shop the rotation</Link>} />}</aside></div> : null
}

function CartLine({ item, onUpdateQuantity, onRemove, compact = false }) { const price = item.product.salePrice || item.product.price; const maxQuantity = Math.min(5, Number(item.product.inventory || 0)); return <div className={`cart-line ${compact ? 'cart-line--compact' : ''}`}><CatalogImage src={item.product.images[0]} alt={item.product.name} sizes="155px" /><div className="cart-line-info"><Link to={`/product/${item.product.slug}`}>{item.product.name}</Link><span>{item.color} / {item.size}</span><strong>{formatMoney(price * item.quantity)}</strong><div className="mini-quantity"><button onClick={() => onUpdateQuantity(item.key, item.quantity - 1)} aria-label="Decrease quantity"><Icon name="minus" size={12} /></button><span>{item.quantity}</span><button onClick={() => onUpdateQuantity(item.key, item.quantity + 1)} disabled={item.quantity >= maxQuantity} aria-label="Increase quantity"><Icon name="plus" size={12} /></button></div></div><button className="remove-line" onClick={() => onRemove(item.key)} aria-label={`Remove ${item.product.name}`}><Icon name="close" size={15} /></button></div> }

function CartPage({ cart, onUpdateQuantity, onRemove, onCheckout }) {
  const subtotal = cart.reduce((total, item) => total + (item.product.salePrice || item.product.price) * item.quantity, 0)
  const shipping = subtotal > 0 ? SHIPPING_CHARGE : 0
  return <main className="cart-page"><div className="page-shell"><Breadcrumbs items={[{ label: 'Shopping bag' }]} /><div className="cart-heading"><div><span className="eyebrow">Review your rotation</span><h1>Shopping bag</h1></div>{cart.length > 0 && <span>{cart.reduce((a, i) => a + i.quantity, 0)} pieces</span>}</div>{cart.length ? <div className="cart-layout"><div className="cart-items">{cart.map((item) => <CartLine key={item.key} item={item} onUpdateQuantity={onUpdateQuantity} onRemove={onRemove} />)}<Link to="/shop" className="text-link back-link"><Icon name="back" size={15} /> Continue shopping</Link></div><OrderSummary subtotal={subtotal} shipping={shipping} onCheckout={onCheckout} /></div> : <EmptyState title="No pieces yet" copy="Your bag is waiting for its first addition." action={<Link to="/shop" className="button button-dark">Shop the rotation</Link>} />}</div></main>
}

function OrderSummary({ subtotal, shipping, onCheckout, checkoutLabel = 'Checkout', disabled = false }) { return <aside className="order-summary"><span className="eyebrow">Summary</span><h2>Matchday total</h2><div className="summary-lines"><div><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div><div><span>Shipping</span><strong>{formatMoney(shipping)}</strong></div></div><div className="summary-total"><span>Total</span><strong>{formatMoney(subtotal + shipping)}</strong></div><button className="button button-dark" type="button" onClick={onCheckout} disabled={!subtotal || disabled}>{checkoutLabel} <Icon name="arrow" size={16} /></button><p className="secure-note">Totals are verified on our server · payments secured by Razorpay · all sales final.</p></aside> }

function CheckoutPage({ cart, account, onPlaceOrder }) {
  const [form, setForm] = useState({
    name: account?.name || '',
    email: account?.email || '',
    phone: account?.phone || '',
    address: account?.address || '',
    address2: account?.address2 || '',
    landmark: account?.landmark || '',
    city: account?.city || '',
    state: account?.state || '',
    country: 'India',
    postal: account?.postal || '',
    terms: false
  })
  const [error, setError] = useState('')
  const [stage, setStage] = useState('idle')
  const paymentLock = useRef(false)
  const placing = stage !== 'idle'
  const subtotal = cart.reduce((total, item) => total + (item.product.salePrice || item.product.price) * item.quantity, 0)
  const shipping = subtotal > 0 ? SHIPPING_CHARGE : 0
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  useEffect(() => {
    if (!account?.uid) return
    setForm((current) => ({
      ...current,
      name: account.name || current.name,
      email: account.email || '',
      phone: account.phone || current.phone,
      address: account.address || current.address,
      address2: account.address2 || current.address2,
      landmark: account.landmark || current.landmark,
      city: account.city || current.city,
      state: account.state || current.state,
      postal: account.postal || current.postal
    }))
  }, [account?.uid])
  useEffect(() => { const button = document.querySelector('.place-order'); if (button) button.dataset.status = placing ? 'processing' : 'idle' }, [placing])
  const buttonLabel = stage === 'creating' ? 'Creating secure order…' : stage === 'awaiting' ? 'Complete payment in Razorpay…' : stage === 'verifying' ? 'Verifying payment…' : 'Pay securely with Razorpay'
  const validateAndPlace = async () => {
    if (paymentLock.current || placing) return
    if (!form.terms) return setError('Please accept the terms, return policy, and privacy policy to continue.')
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
  return <main className="checkout-page"><div className="page-shell"><Breadcrumbs items={[{ label: 'Checkout' }]} /><div className="checkout-heading"><span className="eyebrow">Secure Razorpay checkout</span><h1>Ready when you are.</h1><p>Your saved delivery details are ready below. Your total is recalculated on our server before Razorpay opens, and Scudo never receives or stores your card, UPI PIN, or banking credentials.</p></div>{!account ? <EmptyState title="Sign in to check out" copy="Your verified account protects the order and delivery details tied to this payment." action={<Link to="/account" className="button button-dark">Go to account</Link>} /> : !cart.length ? <EmptyState title="Your bag is empty" copy="Add something before checking out." action={<Link to="/shop" className="button button-dark">Shop the rotation</Link>} /> : <form className="checkout-layout" onSubmit={submit}><div className="checkout-form"><FormSection title="Contact"><div className="form-grid"><Field label="Full name" value={form.name} onChange={(v) => update('name', v)} required autoComplete="name" /><Field label="Email address" type="email" value={form.email} onChange={(v) => update('email', v)} required autoComplete="email" readOnly /><Field label="Phone number" type="tel" value={form.phone} onChange={(v) => update('phone', v)} required autoComplete="tel" inputMode="tel" maxLength={24} /></div></FormSection><FormSection title="Delivery address"><div className="form-grid"><Field label="House number and street" value={form.address} onChange={(v) => update('address', v)} required wide autoComplete="address-line1" maxLength={220} /><Field label="Apartment, area or floor" value={form.address2} onChange={(v) => update('address2', v)} wide autoComplete="address-line2" maxLength={120} /><Field label="Landmark (optional)" value={form.landmark} onChange={(v) => update('landmark', v)} wide maxLength={120} /><Field label="City" value={form.city} onChange={(v) => update('city', v)} required autoComplete="address-level2" maxLength={80} /><Field label="State" value={form.state} onChange={(v) => update('state', v)} required autoComplete="address-level1" maxLength={80} /><Field label="Country" value={form.country} onChange={(v) => update('country', v)} required autoComplete="country-name" readOnly /><Field label="PIN code" value={form.postal} onChange={(v) => update('postal', v.replace(/\D/g, '').slice(0, 6))} required autoComplete="postal-code" inputMode="numeric" maxLength={6} /></div></FormSection><FormSection title="Payment"><div className="payment-note payment-note--secure"><span className="payment-badge">RAZORPAY</span><p><strong>Choose UPI, card, wallet, or net banking securely in Razorpay Checkout.</strong><br />Payment is accepted only after server-side signature and captured-status verification.</p></div></FormSection><label className="checkbox-row"><input type="checkbox" checked={form.terms} onChange={(e) => update('terms', e.target.checked)} /><span>I agree to the <Link to="/terms">terms</Link>, <Link to="/returns">return policy</Link>, and <Link to="/privacy">privacy policy</Link>.</span></label>{error && <p className="form-error form-error--block" role="alert">{error}</p>}<button className="button button-dark place-order" type="submit" disabled={placing} aria-busy={placing}>{buttonLabel} <Icon name="arrow" size={16} /></button></div><OrderSummary subtotal={subtotal} shipping={shipping} checkoutLabel={buttonLabel} onCheckout={validateAndPlace} disabled={placing} /></form>}</div></main>
}

function FormSection({ title, children }) { return <section className="form-section"><h2>{title}</h2>{children}</section> }
function Field({ label, type = 'text', value, onChange, required, wide, autoComplete, inputMode, maxLength, placeholder, readOnly = false }) { return <label className={`field ${wide ? 'field--wide' : ''}`}><span>{label}{required && ' *'}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} autoComplete={autoComplete} inputMode={inputMode} maxLength={maxLength} placeholder={placeholder} readOnly={readOnly} /></label> }

function OrderConfirmation({ order }) { if (!order) return <main className="confirmation-page"><EmptyState title="No order to confirm" copy="Complete checkout while signed in to view an order confirmation." action={<Link to="/shop" className="button button-dark">Shop the rotation</Link>} /></main>; const paid = order.payment?.status === 'Paid'; const processing = order.payment?.status === 'Processing'; return <main className="confirmation-page"><div className="confirmation-card"><div className="confirmation-mark"><Icon name={paid ? 'check' : 'chevron'} size={26} /></div><span className="eyebrow">Order received / {order.number || 'SC-PENDING'}</span><h1>{paid ? 'Payment confirmed.' : 'Payment received.'}</h1><p>{paid ? 'Razorpay verified and captured your payment securely.' : processing ? 'Your payment signature is verified and Razorpay is completing capture. Do not submit another payment for this order.' : 'Your order is being reviewed.'} Report verified damaged, defective, incorrect, or missing-item issues within 48 hours of delivery.</p><div className="confirmation-meta"><div><span>Payment status</span><strong>{order.payment?.status || 'Processing'}</strong></div><div><span>Estimated delivery</span><strong>4–15 business days after capture</strong></div><div><span>Ship to</span><strong>{order.city || 'Your city'}, {order.country || 'India'}</strong></div></div><Link to="/shop" className="button button-dark">Continue shopping <Icon name="arrow" size={16} /></Link></div></main> }

function WishlistPage({ wishlist, onToggleWishlist, onQuickAdd }) { const wished = products.filter((product) => wishlist.includes(product.id)); return <main className="shop-page wishlist-page"><div className="page-shell"><Breadcrumbs items={[{ label: 'Wishlist' }]} /><div className="shop-heading"><div><span className="eyebrow">Saved for later</span><h1>Your wishlist</h1></div><p>{wished.length ? `${wished.length} pieces saved.` : 'Keep the good ones close.'}</p></div>{wished.length ? <div className="product-grid product-grid--four">{wished.map((product) => <ProductCard key={product.id} product={product} onQuickAdd={onQuickAdd} wishlist={wishlist} onToggleWishlist={onToggleWishlist} />)}</div> : <EmptyState title="Your list is quiet" copy="Tap the heart on a piece to save it for later." action={<Link to="/shop" className="button button-dark">Shop the rotation</Link>} />}</div></main> }

function CollectionsPage() { return <main className="collections-page"><div className="page-shell"><Breadcrumbs items={[{ label: 'Collections' }]} /><div className="shop-heading"><div><span className="eyebrow">The edit</span><h1>Collections</h1></div><p>Different moods, one point of view.</p></div><div className="collection-list">{collections.map((collection, index) => <Link to={collection.path} className={`collection-feature collection-feature--${collection.tone}`} key={collection.title}><CatalogImage src={collection.image} alt={`${collection.title} collection`} sizes="(max-width: 740px) 100vw, 50vw" loading="lazy" /><div><span className="eyebrow">{collection.eyebrow}</span><h2>{collection.title}</h2><p>{collection.copy}</p><span className="text-link">Explore collection <Icon name="arrow" size={15} /></span></div><span className="collection-number">0{index + 1}</span></Link>)}</div></div></main> }

function ContactChannels() {
  return <section className="contact-channels" aria-label="Connect with Scudo Clothing">
    <div className="contact-channels__heading"><span className="eyebrow">Follow the rotation</span><h2>Find Scudo everywhere.</h2></div>
    <div className="contact-channels__grid">{socialLinks.map((social) => <a key={social.name} href={social.href} target={social.name === 'Email' ? undefined : '_blank'} rel={social.name === 'Email' ? undefined : 'noreferrer'}><span className="contact-channels__icon"><Icon name={social.icon} size={19} /></span><span><strong>{social.name}</strong><small>{social.handle}</small></span><Icon name="arrow" size={15} /></a>)}</div>
  </section>
}

function ContactPage() {
  const [form, setForm] = useState({ name: '', contact: '', order: '', topic: 'General enquiry', message: '' })
  const [opening, setOpening] = useState(false)
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const submit = (event) => {
    event.preventDefault()
    if (opening) return
    const lines = [
      'Hello SCUDO Clothings,',
      '',
      `Name: ${form.name.trim()}`,
      `Contact: ${form.contact.trim()}`,
      `Order number: ${form.order.trim() || 'Not provided'}`,
      `Topic: ${form.topic}`,
      '',
      'Message:',
      form.message.trim()
    ]
    const whatsappUrl = `https://wa.me/918767416351?text=${encodeURIComponent(lines.join('\n'))}`
    setOpening(true)
    window.setTimeout(() => window.location.assign(whatsappUrl), 220)
  }

  return <main className="info-page contact-page"><div className="page-shell"><Breadcrumbs items={[{ label: 'Contact' }]} /><div className="info-hero contact-hero"><span className="eyebrow">Say hello / Direct message</span><h1>Over to<br /><em>you.</em></h1><p>Questions about a product, size, order, payment, or return? Complete the form and continue the conversation directly on WhatsApp.</p></div><section className="contact-direct"><div className="contact-direct__intro"><span className="eyebrow">WhatsApp support</span><h2>Tell us what<br />you need.</h2><p>Your details stay in your browser until you press send. We will create a pre-filled message and redirect you to WhatsApp.</p><a href="https://wa.me/918767416351" target="_blank" rel="noreferrer"><span>+91 87674 16351</span><Icon name="arrow" size={16} /></a><small>Monday–Friday / 10:00–18:00 IST</small></div><form className="contact-message-form" onSubmit={submit}><div className="contact-form-heading"><span className="eyebrow">Direct message</span><strong>Fields marked * are required.</strong></div><div className="contact-form-grid"><label className="contact-field"><span>Full name *</span><input type="text" value={form.name} onChange={(event) => update('name', event.target.value)} autoComplete="name" required /></label><label className="contact-field"><span>Phone or email *</span><input type="text" value={form.contact} onChange={(event) => update('contact', event.target.value)} autoComplete="email" required /></label><label className="contact-field"><span>Order number</span><input type="text" value={form.order} onChange={(event) => update('order', event.target.value)} placeholder="Optional" /></label><label className="contact-field"><span>Topic *</span><select value={form.topic} onChange={(event) => update('topic', event.target.value)} required><option>General enquiry</option><option>Product or size</option><option>Existing order</option><option>Return or replacement</option><option>Payment</option><option>Partnership</option></select></label><label className="contact-field contact-field--wide"><span>Message *</span><textarea value={form.message} onChange={(event) => update('message', event.target.value)} rows="6" required placeholder="How can we help?" /></label></div><button className="button button-dark contact-send" type="submit" disabled={opening} aria-busy={opening}>{opening ? 'Opening WhatsApp…' : 'Send on WhatsApp'} <Icon name={opening ? 'check' : 'arrow'} size={16} /></button><p className="contact-privacy-note">By continuing, WhatsApp will process the message according to its own privacy policy.</p></form></section><ContactChannels /></div></main>
}

function TermsPage() {
  const clauses = [
    {
      number: '05',
      title: 'Shipping timelines & delivery',
      paragraphs: [
        'Shipping timelines and delivery dates may vary depending on the delivery location, courier partner, weather conditions, public holidays, logistics delays, or circumstances beyond our control.',
        'SCUDO Clothings will not be responsible for delays caused by third-party courier services, incorrect addresses, customer unavailability, or unforeseen delivery issues.'
      ]
    },
    {
      number: '06',
      title: 'Returns, exchanges & refunds',
      paragraphs: [
        'Returns and exchanges are not accepted for change of mind, incorrect customer-selected size, personal preference, or when the customer no longer wants the product.',
        'Verified damaged, defective, incorrect, wrong-size, or missing-item claims may qualify for replacement or refund when reported within 48 hours of delivery and approved under our Return, Exchange & Refund Policy.'
      ]
    },
    {
      number: '07',
      title: 'Intellectual property',
      paragraphs: [
        'All content on this website, including the SCUDO Clothings name, logo, tagline, product designs, graphics, images, videos, text, layout, and branding elements, is the property of SCUDO Clothings.',
        'No content from this website may be copied, reproduced, modified, distributed, uploaded, sold, or used for commercial purposes without written permission from SCUDO Clothings.'
      ]
    },
    {
      number: '08',
      title: 'User responsibility',
      paragraphs: [
        'Users must not misuse the website by attempting to hack, damage, overload, copy, or interfere with its normal functioning. Any fraudulent activity, false information, unauthorized access, or misuse of the website may result in order cancellation, account restriction, or legal action.'
      ]
    },
    {
      number: '09',
      title: 'Privacy',
      paragraphs: [
        'By using our website, you agree that your personal information may be collected and used according to our Privacy Policy. This information may be used for order processing, delivery, customer support, communication, marketing, and service improvement.'
      ]
    },
    {
      number: '10',
      title: 'Limitation of liability',
      paragraphs: [
        'SCUDO Clothings will not be responsible for any indirect, incidental, special, or consequential loss arising from the use of our website, delayed delivery, product misuse, incorrect size selection, payment gateway issues, or third-party service problems.',
        'Our total liability, if any, shall be limited to the amount paid by the customer for the specific product or order.'
      ]
    },
    {
      number: '11',
      title: 'Changes to terms',
      paragraphs: [
        'SCUDO Clothings reserves the right to update or modify these Terms & Conditions at any time. Any changes will be posted on this page, and continued use of the website after such changes means you accept the updated terms.'
      ]
    },
    {
      number: '12',
      title: 'Governing law',
      paragraphs: [
        'These Terms & Conditions shall be governed by the laws of India. Any dispute related to the use of this website, purchases, services, or policies shall be subject to the jurisdiction of the appropriate courts in Maharashtra, India.'
      ]
    }
  ]

  return <main className="info-page terms-page"><div className="page-shell"><Breadcrumbs items={[{ label: 'Terms' }]} /><div className="info-hero terms-hero"><span className="eyebrow">Legal / Terms</span><h1>The ground<br /><em>rules.</em></h1><p>These Terms &amp; Conditions explain the rules for using the SCUDO Clothings website, placing orders, and receiving our services.</p></div><div className="terms-intro"><div><span className="eyebrow">Orders</span><p>An order is confirmed after the configured payment provider accepts it and the order details are verified. A fixed ₹50 shipping charge applies to every order.</p></div><div><span className="eyebrow">Returns &amp; support</span><p>Change-of-mind and customer-selected-size returns are not accepted. Verified product or delivery issues must be reported within 48 hours under our <Link to="/returns">Return Policy</Link>.</p></div></div><div className="terms-list">{clauses.map((clause) => <section className="terms-clause" key={clause.number}><div className="terms-clause__heading"><span>{clause.number}</span><h2>{clause.title}</h2></div><div className="terms-clause__copy">{clause.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></section>)}</div><p className="terms-acceptance">By using the SCUDO Clothings website, you acknowledge that you have read, understood, and agreed to these Terms &amp; Conditions.</p></div></main>
}

function PrivacyPage() {
  const clauses = [
    {
      number: '01',
      title: 'Information we collect',
      paragraphs: [
        'When you use our website or place an order, we may collect personal information such as your name, email address, phone number, billing address, shipping address, payment transaction details, order history, and communication details.',
        'We may also collect non-personal information such as browser type, device type, IP address, location data, pages visited, time spent on the website, referral source, and website usage behaviour.'
      ]
    },
    {
      number: '02',
      title: 'How we use your information',
      paragraphs: [
        'SCUDO Clothings uses personal information only where it is reasonably necessary to operate, protect, and improve our store and services.'
      ],
      bullets: [
        'Process and deliver your orders',
        'Confirm payments and manage transactions',
        'Provide customer support',
        'Send order updates, delivery updates, and important notifications',
        'Handle order concerns, payment failures, delivery issues, and remedies required by law',
        'Improve our website, products, and services',
        'Personalise your shopping experience',
        'Send promotional messages, offers, and marketing communication when you have opted in',
        'Prevent fraud, misuse, unauthorised access, or illegal activities',
        'Comply with legal, tax, accounting, and regulatory requirements'
      ]
    },
    {
      number: '03',
      title: 'Payment information',
      paragraphs: [
        'Payments made on our website may be processed through secure third-party payment gateways. SCUDO Clothings does not directly store your complete card details, UPI PIN, net banking passwords, or other sensitive payment credentials.',
        'Your payment information is handled by the payment gateway provider according to its own security and privacy policies.'
      ]
    },
    {
      number: '04',
      title: 'Cookies & tracking technologies',
      paragraphs: [
        'Our website may use cookies and similar tracking technologies to improve your browsing experience, remember your preferences, analyse website traffic, and show relevant content or advertisements.',
        'You can choose to disable cookies through your browser settings. However, disabling cookies may affect some features and functionality of the website.'
      ]
    },
    {
      number: '05',
      title: 'Sharing of information',
      paragraphs: [
        'SCUDO Clothings does not sell or rent your personal information to third parties. We may share information with trusted service providers only when necessary to operate our store and fulfil our obligations.',
        'These third parties are expected to use your information only for the purpose of providing their services to SCUDO Clothings.'
      ],
      bullets: [
        'Courier and logistics partners',
        'Payment gateway providers',
        'Website hosting and technology service providers',
        'Marketing and advertising platforms',
        'Customer support tools',
        'Analytics service providers',
        'Legal, tax, or regulatory authorities when required by law'
      ]
    },
    {
      number: '06',
      title: 'Marketing communication',
      paragraphs: [
        'If you subscribe to our newsletter, offers, WhatsApp updates, SMS alerts, or email communication, we may use your contact details to send promotional messages, new collection updates, discount offers, and brand announcements.',
        'You may opt out of marketing communication at any time by using the unsubscribe option or contacting us directly.'
      ]
    },
    {
      number: '07',
      title: 'Data security',
      paragraphs: [
        'We take reasonable security measures to protect your personal information from unauthorised access, misuse, loss, alteration, or disclosure.',
        'However, no method of online transmission or electronic storage is completely secure. While we try our best to protect your information, SCUDO Clothings cannot guarantee absolute security.'
      ]
    },
    {
      number: '08',
      title: 'Data retention',
      paragraphs: [
        'We may retain your personal information for as long as necessary to process orders, provide services, resolve disputes, prevent fraud, comply with legal obligations, and maintain business records.',
        'When your information is no longer required, we may delete, anonymise, or securely store it according to applicable laws and business requirements.'
      ]
    },
    {
      number: '09',
      title: 'Your rights',
      paragraphs: [
        'Depending on applicable laws, you may have the following rights regarding your personal information.'
      ],
      bullets: [
        'Access the personal information we hold about you',
        'Correct inaccurate or incomplete information',
        'Request deletion of your personal data',
        'Withdraw consent for marketing communication',
        'Request restriction of certain data processing',
        'Contact us regarding privacy-related concerns'
      ]
    },
    {
      number: '10',
      title: 'Third-party links',
      paragraphs: [
        'Our website may contain links to third-party websites, payment gateways, social media platforms, or external services. SCUDO Clothings is not responsible for the privacy practices, content, security, or policies of these third-party websites.',
        'We recommend that you read the privacy policies of any external websites you visit.'
      ]
    },
    {
      number: '11',
      title: 'Children’s privacy',
      paragraphs: [
        'Our website is intended for general users and is not specifically directed toward children under the age of 13. We do not knowingly collect personal information from children without parental or guardian consent.',
        'If you believe that a child has provided personal information to us, please contact us so we can take appropriate action.'
      ]
    },
    {
      number: '12',
      title: 'Legal compliance',
      paragraphs: [
        'We may disclose your personal information if required by law, court order, government request, regulatory authority, or to protect the rights, safety, and security of SCUDO Clothings, our customers, or the public.'
      ]
    },
    {
      number: '13',
      title: 'Changes to this policy',
      paragraphs: [
        'SCUDO Clothings reserves the right to update or modify this Privacy Policy at any time. Any changes will be posted on this page with the updated date.',
        'Your continued use of the website after changes are posted means you accept the updated Privacy Policy.'
      ]
    },
    {
      number: '14',
      title: 'Contact us',
      paragraphs: [
        'If you have any questions, concerns, or requests regarding this Privacy Policy or the handling of your personal information, contact us at scudoclothing@gmail.com.'
      ]
    }
  ]

  return <main className="info-page terms-page privacy-page"><div className="page-shell"><Breadcrumbs items={[{ label: 'Privacy' }]} /><div className="info-hero terms-hero"><span className="eyebrow">Legal / Privacy</span><h1>Privacy<br /><em>Policy.</em></h1><p>Welcome to SCUDO Clothings. Your privacy is important to us. This Privacy Policy explains how we collect, use, store, and protect your personal information when you visit our website, place an order, contact us, or use any of our services.</p><span className="privacy-updated">Last updated: 29 July 2026</span></div><div className="terms-intro"><div><span className="eyebrow">Our commitment</span><p>We use your information to operate the store, fulfil orders, provide support, and improve your experience. We do not sell or rent your personal information.</p></div><div><span className="eyebrow">Your control</span><p>Contact <a href="mailto:scudoclothing@gmail.com">scudoclothing@gmail.com</a> to ask about access, correction, deletion, or marketing preferences.</p></div></div><div className="terms-list">{clauses.map((clause) => <section className="terms-clause" key={clause.number}><div className="terms-clause__heading"><span>{clause.number}</span><h2>{clause.title}</h2></div><div className="terms-clause__copy">{clause.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{clause.bullets && <ul>{clause.bullets.map((item) => <li key={item}>{item}</li>)}</ul>}</div></section>)}</div><p className="terms-acceptance">By using the SCUDO Clothings website, you acknowledge that you have read, understood, and agreed to this Privacy Policy.</p></div></main>
}

function ReturnPolicyPage() {
  const clauses = [
    {
      number: '01',
      title: 'General return policy',
      paragraphs: [
        'SCUDO Clothings does not accept returns or exchanges for change of mind, incorrect size selection, personal preference, or when the customer no longer wants the product after receiving it.',
        'Customers are requested to carefully check the product description, size chart, specifications, and other details before placing an order.'
      ]
    },
    {
      number: '02',
      title: 'Damaged, defective or incorrect products',
      paragraphs: [
        'A replacement or refund may be provided for an eligible issue reported to SCUDO Clothings within 48 hours of delivery. Requests made after 48 hours may not be accepted.'
      ],
      bullets: [
        'You receive a damaged product',
        'You receive a defective product',
        'You receive a product different from what you ordered',
        'The delivered size differs from the size in your confirmed order',
        'An item is missing from your order'
      ]
    },
    {
      number: '03',
      title: 'Unboxing video requirement',
      paragraphs: [
        'To help us verify damaged, incorrect, missing, or defective product claims, customers are strongly requested to record a clear, continuous unboxing video from before opening the package until the complete product is visible.',
        'SCUDO Clothings may request photographs, videos, packaging details, order details, or other reasonable evidence before approving a claim.'
      ],
      bullets: [
        'The sealed package',
        'The shipping label',
        'Opening of the package',
        'The product received',
        'Any damage, defect, incorrect item, or missing product'
      ]
    },
    {
      number: '04',
      title: 'Conditions for replacement',
      paragraphs: [
        'Products that have been used, washed, altered, damaged after delivery, or returned without their original tags may not be eligible for replacement.'
      ],
      bullets: [
        'Unused and unwashed',
        'Unworn, except for reasonable inspection or size checking',
        'Free from stains, perfume, deodorant, or other marks',
        'Returned with original tags and packaging'
      ]
    },
    {
      number: '05',
      title: 'Size issues',
      paragraphs: [
        'Please check the size chart carefully before placing your order. We do not normally provide returns, refunds, or exchanges when the customer selects the wrong size while ordering.',
        'If SCUDO Clothings sends a size different from the size confirmed in your order, you may request a replacement within the 48-hour claim window.'
      ]
    },
    {
      number: '06',
      title: 'Refunds',
      paragraphs: [
        'Where a genuine issue is verified, SCUDO Clothings will normally first offer a replacement. If a replacement cannot reasonably be provided because the product or required size is unavailable, we may offer a refund.',
        'Approved refunds will be processed to the original payment method or through another mutually agreed payment method. The time taken for the amount to appear may depend on the bank, UPI provider, card issuer, or payment gateway.'
      ]
    },
    {
      number: '07',
      title: 'Order cancellation',
      paragraphs: [
        'Customers should contact SCUDO Clothings as soon as possible if they wish to cancel an order. An order may be cancelled only if it has not yet been shipped or dispatched. Once shipped, cancellation may not be possible.',
        'SCUDO Clothings may cancel an order because of product unavailability, payment issues, incorrect pricing, suspected fraudulent activity, or other unavoidable circumstances. If payment has been successfully received for an order cancelled by SCUDO Clothings, the applicable amount will be refunded.'
      ]
    },
    {
      number: '08',
      title: 'Delivery refusal',
      paragraphs: [
        'Customers are requested not to refuse prepaid orders without contacting SCUDO Clothings. Repeated refusal of orders, fraudulent orders, or misuse of our return or replacement process may result in future orders being restricted or cancelled.'
      ]
    },
    {
      number: '09',
      title: 'How to raise a request',
      paragraphs: [
        'For an eligible replacement or refund request, email scudoclothings@gmail.com. Our team will review the request and provide further instructions.'
      ],
      bullets: [
        'Order number',
        'Customer name',
        'Registered phone number or email',
        'Description of the issue',
        'Clear photographs of the product',
        'Unboxing video, where applicable'
      ]
    },
    {
      number: '10',
      title: 'Policy abuse',
      paragraphs: [
        'SCUDO Clothings reserves the right to reject claims involving fraudulent activity, manipulated evidence, intentional product damage, repeated misuse of the policy, or claims that do not meet the conditions stated above.'
      ]
    },
    {
      number: '11',
      title: 'Policy updates',
      paragraphs: [
        'SCUDO Clothings may update this Return, Exchange & Refund Policy when required. Any changes will be published on this page with the updated date.'
      ]
    }
  ]

  return <main className="info-page terms-page return-policy-page"><div className="page-shell"><Breadcrumbs items={[{ label: 'Return policy' }]} /><div className="info-hero terms-hero"><span className="eyebrow">Customer care / Returns</span><h1>Return, exchange<br /><em>&amp; refund.</em></h1><p>At SCUDO Clothings, we carefully check our products before dispatch to help ensure that customers receive their orders in good condition. Please read this policy carefully before placing an order.</p><span className="privacy-updated">Last updated: 3 August 2026</span></div><div className="terms-intro"><div><span className="eyebrow">48-hour claim window</span><p>Report damaged, defective, incorrect, wrong-size, or missing-item issues within 48 hours of delivery. Requests made later may not be accepted.</p></div><div><span className="eyebrow">How to contact us</span><p>Email <a href="mailto:scudoclothings@gmail.com">scudoclothings@gmail.com</a> with your order number, photos, and unboxing video where applicable.</p></div></div><div className="terms-list">{clauses.map((clause) => <section className="terms-clause" key={clause.number}><div className="terms-clause__heading"><span>{clause.number}</span><h2>{clause.title}</h2></div><div className="terms-clause__copy">{clause.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{clause.bullets && <ul>{clause.bullets.map((item) => <li key={item}>{item}</li>)}</ul>}</div></section>)}</div><p className="terms-acceptance">By placing an order with SCUDO Clothings, you acknowledge that you have read and understood this Return, Exchange &amp; Refund Policy.</p></div></main>
}

function StorePolicyPage({ type }) {
  if (type === 'terms') return <TermsPage />
  const sections = [
    ['Shipping', 'A fixed ₹50 shipping charge applies to every order across India. Orders ship in 4–15 business days, and tracking details are sent once your order leaves us.'],
    ['Returns & replacements', 'Change-of-mind and customer-selected-size returns are not accepted. Verified damaged, defective, incorrect, or missing-item issues must be reported within 48 hours of delivery.']
  ]
  return <main className="info-page"><div className="page-shell"><Breadcrumbs items={[{ label: 'Shipping & returns' }]} /><div className="info-hero"><span className="eyebrow">Customer care</span><h1>Shipping &amp;<br /><em>returns.</em></h1><p>Please review your order, confirm your size, and understand the 48-hour verified-issue claim window before completing your purchase.</p></div><div className="info-sections">{sections.map(([title, copy]) => <section key={title}><span className="eyebrow">{title}</span><p>{copy}</p></section>)}</div><Link className="button button-dark" to="/returns">Read the return policy <Icon name="arrow" size={16} /></Link></div></main>
}

function LegacyAboutPage() {
  const story = [
    {
      label: 'About us',
      paragraphs: [
        'Founded in 2026 in Washim, Maharashtra, Scudo Clothings was created with one bold goal: to become the number one name in everyday fashion, loved by Gen Z and worn with pride across the world. From day one, we\'ve set out to launch as a global brand, delivering top-quality products, service, and experience to every customer we serve.'
      ]
    },
    {
      label: 'Our first phase',
      paragraphs: [
        'Our journey begins with the game we love. In our first phase, we bring passionate football and sports fans the jerseys that let them wear their colours and cheer for their teams—from football and cricket to every kind of sports jersey. With signature favourites like our France and Portugal jerseys, crafted in breathable, high-performance fabric, we make it easy for fans aged 12 to 30 to represent the teams and players they live for.'
      ]
    },
    {
      label: 'What comes next',
      paragraphs: [
        'But this is only the beginning. Selling jerseys is our starting move—the foundation we\'re building on. As we grow and our revenue rises, our vision is to launch our very own customised clothing line: original t-shirts, pants, and everyday apparel designed entirely by us.',
        'When that day comes, we won\'t just sell you clothes—we\'ll show you exactly how they\'re made. From the material we choose to how, when, and in what way each piece is crafted, everything will be explained openly on our website, because we believe our customers deserve total transparency.'
      ]
    },
    {
      label: 'What makes Scudo different',
      paragraphs: [
        'What makes Scudo different is simple: this isn\'t just a brand—it\'s armour for everyday, designed by the best for the best. We treat every customer like family, and we pour that care into everything we do. Quality, passion, and authenticity are at the heart of every product, and we\'re committed to giving you not just great clothing, but a shopping experience that feels genuine and personal.'
      ]
    },
    {
      label: 'Our promise',
      paragraphs: [
        'As we grow, we\'ll keep evolving—bringing new ideas, new marketing, and new strategies to expand the Scudo family across the globe. Our promise stays the same: to deliver premium products, honest craftsmanship, and an experience worthy of the people who wear us.',
        'Thank you for being part of the Scudo Clothings journey. This is only the start—and we can\'t wait to grow with you.'
      ]
    }
  ]

  return (
    <main className="info-page about-page">
      <div className="page-shell">
        <Breadcrumbs items={[{ label: 'About' }]} />
        <div className="info-hero about-hero">
          <span className="eyebrow">The SCUDO team</span>
          <h1>How it <br /><em>started.</em></h1>
          <p>At SCUDO CLOTHINGS, we&apos;re not just building a brand{'—'}we&apos;re building armour for everyday.</p>
        </div>
        <div className="about-story">
          {story.map((section, index) => (
            <section key={section.label} className="about-story__section">
              <div className="about-story__label">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h2>{section.label}</h2>
              </div>
              <div className="about-story__copy">
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>
          ))}
        </div>
        <p className="about-welcome">Welcome to SCUDO CLOTHINGS—<em>armour for everyday.</em></p>
        <section className="about-company">
          <div>
            <span className="eyebrow">Registered company</span>
            <h2>SCUDO APPARELS<br />PRIVATE LIMITED</h2>
          </div>
          <div className="about-company__details">
            <div>
              <span>Registered Office Address</span>
              <address>Kharatkar Gali No. 1, Near Ganesh Medical,<br />Rajni Chowk, Shukrawar Peth,<br />Washim, Maharashtra, India – 444505</address>
            </div>
            <div>
              <span>Grievance Contact details</span>
              <dl className="about-team-list">
                <div><dt>Founder</dt><dd>Saksham Ghope</dd></div>
                <div><dt>Co-Founder</dt><dd>Samarth Dhekane</dd></div>
                <div><dt>Management team</dt><dd>Rahul Yadav<br />Shree Lokhande<br />Pavan Bhosale</dd></div>
              </dl>
              <a className="about-company__email" href="mailto:scudoclothing@gmail.com">scudoclothing@gmail.com</a>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function AboutPage() {
  const paragraphs = [
    <>At SCUDO CLOTHINGS, we&apos;re not just building a brand{'—'}we&apos;re building armour for everyday. Founded in 2026 in Washim, Maharashtra, Scudo Clothings was created with one bold goal: to become the number one name in everyday fashion, loved by Gen Z and worn with pride across the world. From day one, we&apos;ve set out to launch as a global brand, delivering top-quality products, service, and experience to every customer we serve.</>,
    <>Our journey begins with the game we love. In our first phase, we bring passionate football and sports fans the jerseys that let them wear their colours and cheer for their teams{'—'}from football and cricket to every kind of sports jersey. With signature favourites like our France and Portugal jerseys, crafted in breathable, high-performance fabric, we make it easy for fans aged 12 to 30 to represent the teams and players they live for.</>,
    <>But this is only the beginning. Selling jerseys is our starting move{'—'}the foundation we&apos;re building on. As we grow and our revenue rises, our vision is to launch our very own customised clothing line: original t-shirts, pants, and everyday apparel designed entirely by us.</>,
    <>When that day comes, we won&apos;t just sell you clothes{'—'}we&apos;ll show you exactly how they&apos;re made. From the material we choose to how, when, and in what way each piece is crafted, everything will be explained openly on our website, because we believe our customers deserve total transparency.</>,
    <>What makes Scudo different is simple: this isn&apos;t just a brand{'—'}it&apos;s armour for everyday, designed by the best for the best. We treat every customer like family, and we pour that care into everything we do. Quality, passion, and authenticity are at the heart of every product, and we&apos;re committed to giving you not just great clothing, but a shopping experience that feels genuine and personal.</>,
    <>As we grow, we&apos;ll keep evolving{'—'}bringing new ideas, new marketing, and new strategies to expand the Scudo family across the globe. Our promise stays the same: to deliver premium products, honest craftsmanship, and an experience worthy of the people who wear us.</>,
    <>Thank you for being part of the Scudo Clothings journey. This is only the start{'—'}and we can&apos;t wait to grow with you.</>,
    <>Welcome to SCUDO CLOTHINGS{'—'}armour for everyday.</>
  ]

  return (
    <main className="about-page">
      <article className="about-document" aria-labelledby="about-title">
        <h1 id="about-title">About Us</h1>
        <div className="about-document__copy">
          {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>
        <div className="about-document__company">
          <section>
            <h2>SCUDO APPARELS PRIVATE LIMITED</h2>
            <h3>Registered Office Address</h3>
            <address>
              Kharatkar Gali No. 1, Near Ganesh Medical,<br />
              Rajni Chowk, Shukrawar Peth,<br />
              Washim, Maharashtra, India {'–'} 444505
            </address>
          </section>
          <section>
            <h2>Grievance Contact details:</h2>
            <p>Founder - Saksham Ghope<br />Co-Founder - Samarth Dhekane<br />Management team - Rahul Yadav<br />Shree Lokhande<br />Pavan Bhosale</p>
            <p>Email: <a href="mailto:scudoclothing@gmail.com">scudoclothing@gmail.com</a></p>
          </section>
        </div>
      </article>
    </main>
  )
}

function InfoPage({ type }) {
  if (type === 'shipping-final-sale' || type === 'terms') return <StorePolicyPage type={type} />
  if (type === 'about') return <AboutPage />
  if (type === 'privacy') return <PrivacyPage />
  if (type === 'returns') return <ReturnPolicyPage />
  if (type === 'contact') return <ContactPage />
  const content = { 'size-guide': { eyebrow: 'Find your fit', title: <>The right<br /><em>formation.</em></>, intro: 'Our fits are designed with room to move. Take your usual size for an easy fit, or size down for a closer silhouette.', sections: [['T-shirts & jerseys', 'Measure around the chest at the fullest point. Compare with the chart below. Jerseys are designed to feel relaxed.'], ['Size guide', 'S — 36–38 in chest · M — 39–41 in chest · L — 42–44 in chest · XL — 45–47 in chest · XXL — 48–50 in chest']] } }[type]
  return <main className="info-page"><div className="page-shell"><Breadcrumbs items={[{ label: type === 'about' ? 'About' : type === 'size-guide' ? 'Size guide' : type === 'shipping-final-sale' ? 'Shipping & final sale' : 'Contact' }]} /><div className="info-hero"><span className="eyebrow">{content.eyebrow}</span><h1>{content.title}</h1><p>{content.intro}</p></div><div className="info-sections">{content.sections.map(([title, copy]) => <section key={title}><span className="eyebrow">{title}</span><p>{copy}</p></section>)}</div>{type === 'contact' && <ContactChannels />}{type === 'size-guide' && <div className="size-table"><div className="size-table-head"><span>Size</span><span>Chest</span><span>Length</span></div>{[['S','36–38 in','27 in'],['M','39–41 in','28 in'],['L','42–44 in','29 in'],['XL','45–47 in','30 in'],['XXL','48–50 in','31 in']].map((row) => <div className="size-table-row" key={row[0]}>{row.map((value) => <span key={value}>{value}</span>)}</div>)}</div>} {type === 'contact' && <a className="button button-dark" href="mailto:scudoclothing@gmail.com">Email the team <Icon name="arrow" size={16} /></a>}</div></main>
}

function AuthForm({ onSuccess, compact = false }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [status, setStatus] = useState('idle')
  const submit = async (event) => {
    event.preventDefault()
    if (status !== 'idle') return
    if (mode === 'signup' && !name.trim()) return setError('Please enter your name.')
    if (!email.includes('@') || password.length < 6) return setError('Enter a valid email and a password of at least 6 characters.')
    setError('')
    setNotice('')
    setStatus('email')
    try {
      await onSuccess(await authenticateWithEmail({ mode, name: name.trim(), email: email.trim().toLowerCase(), password }))
    } catch (emailError) {
      setError(firebaseAuthErrorMessage(emailError, 'email'))
      setStatus('idle')
    }
  }
  const googleSignIn = async () => {
    if (status !== 'idle') return
    setError('')
    setNotice('')
    setStatus('google')
    try {
      await onSuccess(await signInWithGoogle())
    } catch (googleError) {
      setError(firebaseAuthErrorMessage(googleError))
      setStatus('idle')
    }
  }
  const resetPassword = async () => {
    if (status !== 'idle') return
    if (!email.includes('@')) return setError('Enter your email address, then choose Forgot password.')
    setError('')
    setNotice('')
    setStatus('reset')
    try {
      await sendFirebasePasswordReset(email)
      setNotice('Password reset email sent. Check your inbox and spam folder.')
      setStatus('idle')
    } catch (resetError) {
      setError(firebaseAuthErrorMessage(resetError, 'email'))
      setStatus('idle')
    }
  }
  const switchMode = () => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setNotice(''); setStatus('idle') }
  return <form className={`auth-form auth-form--${mode} ${compact ? 'auth-form--compact' : ''} ${error ? 'has-error' : ''} ${status !== 'idle' ? 'is-submitting' : ''}`} data-status={status} onSubmit={submit}>
    <button className={`google-auth-button ${status === 'google' ? 'is-loading' : ''}`} type="button" onClick={googleSignIn} disabled={status !== 'idle'}><GoogleIcon /><span>{status === 'google' ? 'Connecting to Google...' : 'Continue with Google'}</span></button>
    <div className="auth-divider"><span>or continue with email</span></div>
    {mode === 'signup' && <Field label="Full name" value={name} onChange={setName} autoComplete="name" required />}
    <Field label="Email address" type="email" value={email} onChange={setEmail} autoComplete="email" required />
    <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required />
    {mode === 'login' && <button className="auth-reset-link" type="button" onClick={resetPassword} disabled={status !== 'idle'}>{status === 'reset' ? 'Sending reset email...' : 'Forgot password?'}</button>}
    {error && <p className="form-error form-error--block" role="status">{error}</p>}
    {notice && <p className="form-success form-success--block" role="status">{notice}</p>}
    <button className="button button-dark auth-submit" type="submit" disabled={status !== 'idle'}>{status === 'email' ? 'Checking...' : mode === 'login' ? 'Log in' : 'Create account'} <Icon name="arrow" size={16} /></button>
    <button className="text-link account-toggle" type="button" onClick={switchMode} disabled={status !== 'idle'}>{mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Log in'}</button>
  </form>
}

function AuthGate({ onClose, onAuthenticated }) {
  const panelRef = useOverlayFocus(true, onClose)
  return <div className="auth-gate-overlay" onClick={onClose}><aside className="auth-gate-card" ref={panelRef} onClick={(event) => event.stopPropagation()} aria-label="Sign in required"><button className="icon-button auth-gate-close" onClick={onClose} aria-label="Close login panel"><Icon name="close" /></button><ScudoLogo size="sm" showSubtitle={false} showShadow={false} /><span className="eyebrow">Members first</span><h2>Sign in to add<br /><em>to your bag.</em></h2><p>Create an account or log in to keep your rotation saved.</p><AuthForm onSuccess={onAuthenticated} compact /></aside></div>
}

function DeliveryProfileSetup({ account, onSave }) {
  const panelRef = useOverlayFocus(true, () => {})
  const [form, setForm] = useState(() => normalizeCustomerProfile(account))
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  useEffect(() => { setForm(normalizeCustomerProfile(account)) }, [account?.uid])

  const submit = async (event) => {
    event.preventDefault()
    if (status === 'saving') return
    const validationError = validateCustomerProfile(form)
    if (validationError) return setError(validationError)
    setError('')
    setStatus('saving')
    try {
      await onSave(form)
      setStatus('saved')
    } catch (saveError) {
      setError(saveError?.message || 'Your delivery details could not be saved. Please try again.')
      setStatus('idle')
    }
  }

  return createPortal(<div className="profile-setup-overlay">
    <section className="profile-setup-card" ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="delivery-profile-title">
      <div className="profile-setup-progress" aria-label="Account setup step 2 of 2"><span /><span className="is-active" /></div>
      <div className="profile-setup-heading">
        <div><span className="eyebrow">Account created / One last step</span><h2 id="delivery-profile-title">Where should<br /><em>we deliver?</em></h2></div>
        <span className="profile-setup-step">02 / 02</span>
      </div>
      <p className="profile-setup-intro">Save your contact and delivery details once. They will be ready at checkout and can be changed later in Settings.</p>
      <form onSubmit={submit}>
        <div className="profile-setup-grid">
          <Field label="Full name" value={form.name} onChange={(value) => update('name', value)} required autoComplete="name" maxLength={80} />
          <Field label="Phone number" type="tel" value={form.phone} onChange={(value) => update('phone', value)} required autoComplete="tel" inputMode="tel" maxLength={24} placeholder="10-digit mobile number" />
          <Field label="House number and street" value={form.address} onChange={(value) => update('address', value)} required wide autoComplete="address-line1" maxLength={220} />
          <Field label="Apartment, area or floor" value={form.address2} onChange={(value) => update('address2', value)} wide autoComplete="address-line2" maxLength={120} placeholder="Optional" />
          <Field label="Landmark" value={form.landmark} onChange={(value) => update('landmark', value)} wide maxLength={120} placeholder="Optional" />
          <Field label="City" value={form.city} onChange={(value) => update('city', value)} required autoComplete="address-level2" maxLength={80} />
          <Field label="State" value={form.state} onChange={(value) => update('state', value)} required autoComplete="address-level1" maxLength={80} />
          <Field label="PIN code" value={form.postal} onChange={(value) => update('postal', value.replace(/\D/g, '').slice(0, 6))} required autoComplete="postal-code" inputMode="numeric" maxLength={6} />
          <Field label="Country" value="India" onChange={() => {}} readOnly autoComplete="country-name" />
        </div>
        {error && <p className="form-error form-error--block" role="alert">{error}</p>}
        <button className="button button-dark profile-setup-submit" type="submit" disabled={status === 'saving'} aria-busy={status === 'saving'}>{status === 'saving' ? 'Saving delivery details…' : 'Save & continue'} <Icon name={status === 'saved' ? 'check' : 'arrow'} size={16} /></button>
        <p className="profile-setup-privacy">Your details are linked to your signed-in account and used for checkout, delivery, and order support. Read our <Link to="/privacy" target="_blank" rel="noreferrer">privacy policy</Link>.</p>
      </form>
    </section>
  </div>, document.body)
}

function AccountPage({ account, order, onAuthenticate, onLogout }) {
  if (account) {
    const initials = account.name?.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'SC'
    return <main className="account-hub"><div className="page-shell">
      <Breadcrumbs items={[{ label: 'Account' }]} />
      <section className="account-hub__hero">
        <div><span className="eyebrow">Scudo membership</span><h1>Your account,<br /><em>properly organised.</em></h1><p>Manage the details that affect your shopping, security, and support experience.</p></div>
        <div className="account-identity">
          <div className="account-avatar">{account.photoURL ? <img src={account.photoURL} alt="" referrerPolicy="no-referrer" /> : initials}</div>
          <div><span>Signed in as</span><strong>{account.name}</strong><small>{account.email}</small></div>
          <span className="status-pill">{account.provider === 'google' ? 'Google account' : 'Email account'}</span>
        </div>
      </section>
      <section className="account-action-grid" aria-label="Account actions">
        <Link to="/orders" className="account-action-card"><span className="account-action-card__number">01</span><div><span className="eyebrow">Purchases</span><h2>Your orders</h2><p>{order ? `Latest order ${order.number || ''} is available on this device.` : 'No completed order is saved on this device yet.'}</p></div><Icon name="arrow" size={19} /></Link>
        <Link to="/settings" className="account-action-card"><span className="account-action-card__number">02</span><div><span className="eyebrow">Account</span><h2>Settings</h2><p>Update your profile, sign-in security, and customer-care links.</p></div><Icon name="arrow" size={19} /></Link>
        <Link to="/contact" className="account-action-card"><span className="account-action-card__number">03</span><div><span className="eyebrow">Customer care</span><h2>Get support</h2><p>Contact the Scudo team about an order, payment, delivery, or product.</p></div><Icon name="arrow" size={19} /></Link>
      </section>
      <section className="account-session"><div><span className="eyebrow">Current session</span><p>Your account is secured by {account.provider === 'google' ? 'Google and Firebase Authentication' : 'Firebase Authentication'}.</p></div><button className="button button-ghost" type="button" onClick={onLogout}>Log out</button></section>
    </div></main>
  }
  return <main className="account-page"><div className="account-card"><ScudoLogo size="sm" /><span className="eyebrow">Welcome back</span><h1>Log in to your account.</h1><AuthForm onSuccess={onAuthenticate} /></div></main>
}

function OrdersPage({ account, order }) {
  if (!account) return <main className="account-page"><div className="account-card"><span className="eyebrow">Members first</span><h1>Log in to see your orders.</h1><p className="demo-note">Sign in to view the latest order saved in this browser.</p><Link to="/account" className="button button-dark">Log in <Icon name="arrow" size={16} /></Link></div></main>
  return <main className="orders-page"><div className="page-shell"><Breadcrumbs items={[{ label: 'Your orders' }]} /><div className="account-page-heading"><span className="eyebrow">Latest purchase</span><h1>Orders.</h1><p>This page currently shows the latest completed order saved on this device.</p></div>{order ? <article className="order-card"><div className="order-card__head"><div><span className="eyebrow">Order {order.number}</span><h2>{order.payment?.status === 'Paid' ? 'Payment verified.' : 'Payment processing.'}</h2></div><span className="status-pill">{order.payment?.status || 'Processing'}</span></div><div className="order-card__meta"><div><span>Date</span><strong>{new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN')}</strong></div><div><span>Ship to</span><strong>{order.city || 'Your city'}, {order.country || 'India'}</strong></div><div><span>Total</span><strong>{formatMoney(order.total || 0)}</strong></div></div><div className="order-card__items">{order.items?.map((item) => <div key={item.key || item.product.id}><CatalogImage src={item.product.images[0]} alt="" sizes="64px" /><div><strong>{item.product.name}</strong><span>{item.size} · Qty {item.quantity}</span></div><b>{formatMoney((item.product.salePrice || item.product.price) * item.quantity)}</b></div>)}</div><p className="order-card__disclosure">For a complete payment or delivery record, contact support with this order number.</p></article> : <EmptyState title="No orders yet" copy="Your first completed Scudo order will appear here after checkout." action={<Link to="/shop" className="button button-dark">Shop the rotation <Icon name="arrow" size={16} /></Link>} />}</div></main>
}

function SettingsPage({ account, onSaveProfile, onSendPasswordReset, onSendVerification, onLogout }) {
  const savedProfile = useMemo(() => normalizeCustomerProfile(account), [account])
  const [profile, setProfile] = useState(savedProfile)
  const [profileState, setProfileState] = useState('idle')
  const [securityState, setSecurityState] = useState('idle')
  const [message, setMessage] = useState('')
  useEffect(() => { setProfile(savedProfile) }, [savedProfile])
  if (!account) return <main className="account-page"><div className="account-card"><span className="eyebrow">Members first</span><h1>Log in to manage settings.</h1><Link to="/account" className="button button-dark">Log in <Icon name="arrow" size={16} /></Link></div></main>
  const updateProfileField = (key, value) => setProfile((current) => ({ ...current, [key]: value }))
  const profileChanged = JSON.stringify(normalizeCustomerProfile(profile)) !== JSON.stringify(savedProfile)
  const saveProfile = async (event) => {
    event.preventDefault()
    const validationError = validateCustomerProfile(profile)
    if (validationError) {
      setProfileState('error')
      return setMessage(validationError)
    }
    setMessage('')
    setProfileState('saving')
    try {
      await onSaveProfile(profile)
      setProfileState('saved')
      setMessage('Your account and delivery details are up to date.')
      window.setTimeout(() => setProfileState('idle'), 1800)
    } catch (error) {
      setMessage(error?.message || firebaseAuthErrorMessage(error, 'email'))
      setProfileState('error')
    }
  }
  const runSecurityAction = async (action, successMessage) => {
    setMessage('')
    setSecurityState('working')
    try {
      await action()
      setMessage(successMessage)
      setSecurityState('sent')
    } catch (error) {
      setMessage(firebaseAuthErrorMessage(error, 'email'))
      setSecurityState('error')
    }
  }
  const providerLabel = account.provider === 'google' ? 'Google' : 'Email and password'
  return <main className="settings-page"><div className="page-shell">
    <Breadcrumbs items={[{ label: 'Settings' }]} />
    <div className="account-page-heading"><span className="eyebrow">Account controls</span><h1>Settings.</h1><p>Manage your delivery profile, sign-in security, and customer-care links.</p></div>
    {message && <p className={`settings-message ${profileState === 'error' || securityState === 'error' ? 'is-error' : ''}`} role="status">{message}</p>}
    <div className="settings-layout">
      <form className="settings-panel settings-panel--profile" onSubmit={saveProfile}>
        <div className="settings-panel__heading"><div><span className="settings-index">01</span><h2>Profile &amp; delivery</h2></div><span className="status-pill">Account secured</span></div>
        <p className="settings-panel__intro">These details are saved to your signed-in account and pre-filled when you checkout.</p>
        <div className="settings-profile-grid">
          <Field label="Full name" value={profile.name} onChange={(value) => updateProfileField('name', value)} required autoComplete="name" maxLength={80} />
          <Field label="Phone number" type="tel" value={profile.phone} onChange={(value) => updateProfileField('phone', value)} required autoComplete="tel" inputMode="tel" maxLength={24} />
          <Field label="Email address" type="email" value={account.email} onChange={() => {}} readOnly />
          <Field label="House number and street" value={profile.address} onChange={(value) => updateProfileField('address', value)} required wide autoComplete="address-line1" maxLength={220} />
          <Field label="Apartment, area or floor" value={profile.address2} onChange={(value) => updateProfileField('address2', value)} wide autoComplete="address-line2" maxLength={120} placeholder="Optional" />
          <Field label="Landmark" value={profile.landmark} onChange={(value) => updateProfileField('landmark', value)} wide maxLength={120} placeholder="Optional" />
          <Field label="City" value={profile.city} onChange={(value) => updateProfileField('city', value)} required autoComplete="address-level2" maxLength={80} />
          <Field label="State" value={profile.state} onChange={(value) => updateProfileField('state', value)} required autoComplete="address-level1" maxLength={80} />
          <Field label="PIN code" value={profile.postal} onChange={(value) => updateProfileField('postal', value.replace(/\D/g, '').slice(0, 6))} required autoComplete="postal-code" inputMode="numeric" maxLength={6} />
          <Field label="Country" value="India" onChange={() => {}} readOnly autoComplete="country-name" />
        </div>
        <p className="field-help" id="email-help">Your sign-in email is managed securely by {providerLabel}. Contact support if it must be changed.</p>
        <div className="settings-panel__footer"><button className="button button-dark" type="submit" disabled={profileState === 'saving' || !profileChanged}>{profileState === 'saving' ? 'Saving...' : profileState === 'saved' ? 'Details saved' : 'Save details'} <Icon name={profileState === 'saved' ? 'check' : 'arrow'} size={16} /></button></div>
      </form>

      <section className="settings-panel">
        <div className="settings-panel__heading"><div><span className="settings-index">02</span><h2>Sign-in &amp; security</h2></div><span className={`status-pill ${account.emailVerified ? '' : 'status-pill--pending'}`}>{account.emailVerified ? 'Email verified' : 'Verification needed'}</span></div>
        <dl className="security-details"><div><dt>Sign-in method</dt><dd>{providerLabel}</dd></div><div><dt>Email</dt><dd>{account.email}</dd></div></dl>
        <div className="security-actions">
          {!account.emailVerified && <button className="button button-ghost" type="button" disabled={securityState === 'working'} onClick={() => runSecurityAction(onSendVerification, 'Verification email sent. Open it from the same device to verify your address.')}>Send verification email</button>}
          {account.provider !== 'google' ? <button className="button button-ghost" type="button" disabled={securityState === 'working'} onClick={() => runSecurityAction(onSendPasswordReset, 'Password reset email sent. Check your inbox and spam folder.')}>Reset password</button> : <p className="field-help">Password and two-step verification are managed in your Google Account.</p>}
        </div>
      </section>

      <section className="settings-panel settings-panel--links">
        <div className="settings-panel__heading"><div><span className="settings-index">03</span><h2>Help &amp; policies</h2></div></div>
        <nav aria-label="Account help"><Link to="/contact">Contact support <Icon name="arrow" size={15} /></Link><Link to="/orders">Latest order <Icon name="arrow" size={15} /></Link><Link to="/returns">Return policy <Icon name="arrow" size={15} /></Link><Link to="/privacy">Privacy policy <Icon name="arrow" size={15} /></Link><Link to="/terms">Terms &amp; conditions <Icon name="arrow" size={15} /></Link></nav>
        <div className="settings-panel__footer"><button className="button button-ghost" type="button" onClick={onLogout}>Log out of this device</button></div>
      </section>
    </div>
  </div></main>
}

function AdminOrderEditor({ order, onSave }) {
  const [fulfilmentStatus, setFulfilmentStatus] = useState(order.fulfilmentStatus || 'unfulfilled')
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '')
  const [state, setState] = useState('idle')

  useEffect(() => {
    setFulfilmentStatus(order.fulfilmentStatus || 'unfulfilled')
    setTrackingNumber(order.trackingNumber || '')
    setState('idle')
  }, [order.orderId, order.fulfilmentStatus, order.trackingNumber])

  const submit = async (event) => {
    event.preventDefault()
    setState('saving')
    try {
      await onSave({ orderId: order.orderId, fulfilmentStatus, trackingNumber })
      setState('saved')
      window.setTimeout(() => setState('idle'), 1800)
    } catch {
      setState('error')
    }
  }

  return <article className="admin-order-card"><div className="admin-order-card__head"><div><span className="eyebrow">{order.receipt || order.orderId}</span><h3>{order.customer.name || 'Customer'}</h3></div><span className={`status-pill status-pill--${order.paymentStatus}`}>{order.paymentStatus}</span></div><div className="admin-order-card__meta"><span>{new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN')}</span><span>{order.customer.email}</span><strong>{formatMoney((order.amount || 0) / 100)}</strong></div><div className="admin-order-card__items">{order.lineItems.map((item) => <span key={`${order.orderId}-${item.productId}-${item.size}`}>{item.quantity} × {item.name} / {item.size}</span>)}</div><p>{[order.customer.address, order.customer.address2, order.customer.landmark && `Landmark: ${order.customer.landmark}`, order.customer.city, order.customer.state, order.customer.postal].filter(Boolean).join(', ')}</p><form className="admin-order-card__form" onSubmit={submit}><label><span>Fulfilment</span><select value={fulfilmentStatus} onChange={(event) => setFulfilmentStatus(event.target.value)}><option value="unfulfilled">Unfulfilled</option><option value="packing">Packing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select></label><label><span>Tracking reference</span><input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} maxLength="100" placeholder="Optional" /></label><button className="button button-dark" type="submit" disabled={state === 'saving'}>{state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved' : 'Save'} <Icon name={state === 'saved' ? 'check' : 'arrow'} size={14} /></button></form>{state === 'error' && <span className="form-error">This update could not be saved. Refresh and try again.</span>}</article>
}

const blankAdminProduct = () => ({
  id: '', slug: '', name: '', sku: '', category: 'Shirts', collection: 'Everyday', description: '', shortDescription: '',
  price: '', salePrice: '', inventory: 1, sizes: ['S', 'M', 'L', 'XL'], colors: ['Black'], images: [], material: '',
  careInstructions: 'Cold wash inside out. Air dry in shade.', edits: [], isNew: true, isFeatured: false, isSoldOut: false,
  visible: true, status: 'active', source: 'custom'
})

const adminListValue = (value) => Array.isArray(value) ? value.join(', ') : value || ''

function AdminCatalogField({ label, wide = false, as = 'input', children, ...props }) {
  return <label className={`admin-catalog-field ${wide ? 'admin-catalog-field--wide' : ''}`}><span>{label}</span>{as === 'textarea' ? <textarea {...props} /> : as === 'select' ? <select {...props}>{children}</select> : <input {...props} />}</label>
}

function AdminCatalogManager({ catalog, onSave, onArchive, onUpload }) {
  const firstProduct = catalog.find((product) => product.status !== 'archived') || catalog[0] || blankAdminProduct()
  const [selectedId, setSelectedId] = useState(firstProduct.id || 'new')
  const [draft, setDraft] = useState(firstProduct)
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [state, setState] = useState('idle')
  const [message, setMessage] = useState('')
  const [imagePath, setImagePath] = useState('')

  useEffect(() => {
    if (selectedId === 'new') return
    const updated = catalog.find((product) => product.id === selectedId)
    if (updated) setDraft(updated)
  }, [catalog, selectedId])

  const update = (field, value) => setDraft((current) => ({ ...current, [field]: value }))
  const filtered = catalog.filter((product) => (showArchived || product.status !== 'archived') && [product.name, product.sku, product.category, product.collection].join(' ').toLowerCase().includes(search.trim().toLowerCase()))
  const choose = (product) => { setSelectedId(product.id); setDraft(product); setState('idle'); setMessage(''); setImagePath('') }
  const createProduct = () => { setSelectedId('new'); setDraft(blankAdminProduct()); setState('idle'); setMessage(''); setImagePath('') }

  const submit = async (event) => {
    event.preventDefault()
    if (state === 'saving' || state === 'uploading') return
    setState('saving')
    setMessage('')
    try {
      const saved = await onSave(draft, selectedId === 'new')
      setSelectedId(saved.id)
      setDraft(saved)
      setState('saved')
      setMessage('Product saved and storefront catalog updated.')
      window.setTimeout(() => setState('idle'), 1800)
    } catch (error) {
      setState('error')
      setMessage(error?.message || 'This product could not be saved.')
    }
  }

  const uploadImages = async (event) => {
    const files = [...(event.target.files || [])].slice(0, Math.max(0, 8 - (draft.images?.length || 0)))
    event.target.value = ''
    if (!files.length) return
    setState('uploading')
    setMessage('Uploading product photos…')
    try {
      const uploaded = []
      for (const file of files) uploaded.push((await onUpload(file)).url)
      update('images', [...(draft.images || []), ...uploaded].slice(0, 8))
      setState('idle')
      setMessage(`${uploaded.length} photo${uploaded.length === 1 ? '' : 's'} uploaded. Save the product to publish the change.`)
    } catch (error) {
      setState('error')
      setMessage(error?.message || 'The product photo could not be uploaded.')
    }
  }

  const addImagePath = () => {
    const value = imagePath.trim()
    if (!value || (draft.images || []).includes(value)) return
    update('images', [...(draft.images || []), value].slice(0, 8))
    setImagePath('')
  }

  const archive = async () => {
    if (selectedId === 'new' || !window.confirm(`Archive ${draft.name}? It will be removed from the storefront but kept in the admin history.`)) return
    setState('saving')
    setMessage('')
    try {
      await onArchive(selectedId)
      setState('saved')
      setMessage('Product archived and removed from the storefront.')
    } catch (error) {
      setState('error')
      setMessage(error?.message || 'This product could not be archived.')
    }
  }

  return <section className="admin-catalog-workspace">
    <aside className="admin-catalog-sidebar">
      <div className="admin-catalog-sidebar__head"><div><span className="eyebrow">Catalog / {catalog.length}</span><h2>Products</h2></div><button type="button" className="button button-dark" onClick={createProduct}><Icon name="plus" size={14} /> Add product</button></div>
      <label className="admin-catalog-search"><Icon name="search" size={15} /><span className="sr-only">Search catalog</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, SKU, category" /></label>
      <label className="admin-flag admin-flag--compact"><input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} /><span>Show archived products</span></label>
      <div className="admin-catalog-list">{filtered.map((product) => <button type="button" key={product.id} className={selectedId === product.id ? 'is-active' : ''} onClick={() => choose(product)}><CatalogImage src={product.shopImage || product.images?.[0]} alt="" sizes="58px" /><span><strong>{product.name}</strong><small>{product.category} · {product.sku}</small><em>{product.status === 'archived' ? 'Archived' : product.isSoldOut ? 'Sold out' : `${product.inventory} in stock`}</em></span><b>{formatMoney(product.salePrice || product.price)}</b></button>)}{!filtered.length && <p className="admin-catalog-empty">No products match this search.</p>}</div>
    </aside>

    <form className="admin-catalog-editor" onSubmit={submit}>
      <div className="admin-catalog-editor__head"><div><span className="eyebrow">{selectedId === 'new' ? 'New catalog item' : `Editing / ${draft.sku}`}</span><h2>{selectedId === 'new' ? 'Add new clothing' : draft.name}</h2><p>Add jerseys, shirts, T-shirts, jeans, trousers, jackets, or any future Scudo category.</p></div><span className={`status-pill ${draft.status === 'archived' ? 'status-pill--cancelled' : ''}`}>{draft.status === 'archived' ? 'Archived' : draft.visible === false ? 'Hidden' : 'Published'}</span></div>
      {message && <p className={`admin-catalog-message ${state === 'error' ? 'is-error' : ''}`} role="status">{message}</p>}
      <section className="admin-editor-section"><div className="admin-editor-section__title"><span>01</span><div><h3>Product identity</h3><p>Customer-facing name, URL, category, and internal stock code.</p></div></div><div className="admin-catalog-form-grid">
        <AdminCatalogField label="Product name" wide value={draft.name || ''} onChange={(event) => update('name', event.target.value)} maxLength="100" required />
        <AdminCatalogField label="SKU" value={draft.sku || ''} onChange={(event) => update('sku', event.target.value)} maxLength="40" placeholder="SC-SHIRT-001" />
        <AdminCatalogField label="URL slug" value={draft.slug || ''} onChange={(event) => update('slug', event.target.value)} maxLength="100" placeholder="black-oversized-shirt" />
        <AdminCatalogField label="Category" value={draft.category || ''} onChange={(event) => update('category', event.target.value)} list="admin-category-suggestions" required />
        <datalist id="admin-category-suggestions"><option value="Jerseys" /><option value="Shirts" /><option value="T-Shirts" /><option value="Jeans" /><option value="Trousers" /><option value="Jackets" /><option value="Hoodies" /><option value="Accessories" /></datalist>
        <AdminCatalogField label="Collection" value={draft.collection || ''} onChange={(event) => update('collection', event.target.value)} maxLength="80" />
      </div></section>

      <section className="admin-editor-section"><div className="admin-editor-section__title"><span>02</span><div><h3>Photos</h3><p>Upload up to eight JPG, PNG, WebP, or AVIF images. The first image is the storefront cover.</p></div></div><div className="admin-image-uploader"><label className="admin-upload-button"><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={uploadImages} disabled={state === 'uploading'} /><Icon name="plus" size={17} /><span>{state === 'uploading' ? 'Uploading…' : 'Upload product photos'}<small>Maximum 4 MB per image</small></span></label><div className="admin-image-path"><input value={imagePath} onChange={(event) => setImagePath(event.target.value)} placeholder="Or paste an existing /image-path.webp" /><button type="button" onClick={addImagePath}>Add path</button></div></div><div className="admin-image-grid">{(draft.images || []).map((src, index) => <div key={`${src}-${index}`}><CatalogImage src={src} alt={`Product preview ${index + 1}`} sizes="140px" /><span>{index === 0 ? 'Cover' : String(index + 1).padStart(2, '0')}</span><div>{index > 0 && <button type="button" onClick={() => update('images', [src, ...draft.images.filter((_, itemIndex) => itemIndex !== index)])}>Make cover</button>}<button type="button" onClick={() => update('images', draft.images.filter((_, itemIndex) => itemIndex !== index))}>Remove</button></div></div>)}{!(draft.images || []).length && <div className="admin-image-placeholder"><Icon name="plus" size={22} /><span>No product photos yet</span></div>}</div></section>

      <section className="admin-editor-section"><div className="admin-editor-section__title"><span>03</span><div><h3>Story & details</h3><p>Describe the product clearly for shoppers and search.</p></div></div><div className="admin-catalog-form-grid"><AdminCatalogField as="textarea" label="Full description" wide value={draft.description || ''} onChange={(event) => update('description', event.target.value)} maxLength="2000" rows="5" required /><AdminCatalogField as="textarea" label="Short description" wide value={draft.shortDescription || ''} onChange={(event) => update('shortDescription', event.target.value)} maxLength="240" rows="2" /><AdminCatalogField label="Material" value={draft.material || ''} onChange={(event) => update('material', event.target.value)} maxLength="180" /><AdminCatalogField label="Care instructions" value={draft.careInstructions || ''} onChange={(event) => update('careInstructions', event.target.value)} maxLength="240" /></div></section>

      <section className="admin-editor-section"><div className="admin-editor-section__title"><span>04</span><div><h3>Pricing & inventory</h3><p>Prices are in Indian rupees and are revalidated by the payment server.</p></div></div><div className="admin-catalog-form-grid"><AdminCatalogField label="Regular price (₹)" type="number" min="1" step="1" value={draft.price ?? ''} onChange={(event) => update('price', event.target.value)} required /><AdminCatalogField label="Discounted price (₹)" type="number" min="1" step="1" value={draft.salePrice ?? ''} onChange={(event) => update('salePrice', event.target.value)} placeholder="Optional" /><AdminCatalogField label="Inventory" type="number" min="0" max="100000" step="1" value={draft.inventory ?? 0} onChange={(event) => update('inventory', event.target.value)} required /><AdminCatalogField label="Status" as="select" value={draft.status || 'active'} onChange={(event) => update('status', event.target.value)}><option value="active">Active</option><option value="archived">Archived</option></AdminCatalogField></div></section>

      <section className="admin-editor-section"><div className="admin-editor-section__title"><span>05</span><div><h3>Variants & merchandising</h3><p>Comma-separate sizes and edit tags.</p></div></div><div className="admin-catalog-form-grid"><AdminCatalogField label="Sizes" value={adminListValue(draft.sizes)} onChange={(event) => update('sizes', event.target.value)} placeholder="S, M, L, XL" required /><AdminCatalogField label="Edit tags" wide value={adminListValue(draft.edits)} onChange={(event) => update('edits', event.target.value)} placeholder="new-arrivals, bestsellers" /></div><div className="admin-flags"><label className="admin-flag"><input type="checkbox" checked={draft.visible !== false} onChange={(event) => update('visible', event.target.checked)} /><span>Visible on storefront</span></label><label className="admin-flag"><input type="checkbox" checked={draft.isNew === true} onChange={(event) => update('isNew', event.target.checked)} /><span>New arrival</span></label><label className="admin-flag"><input type="checkbox" checked={draft.isFeatured === true} onChange={(event) => update('isFeatured', event.target.checked)} /><span>Featured product</span></label><label className="admin-flag"><input type="checkbox" checked={draft.isSoldOut === true} onChange={(event) => update('isSoldOut', event.target.checked)} /><span>Mark sold out</span></label></div></section>

      <div className="admin-catalog-actions"><button className="button button-dark" type="submit" disabled={state === 'saving' || state === 'uploading'}>{state === 'saving' ? 'Saving product…' : 'Save product'} <Icon name="arrow" size={15} /></button>{selectedId !== 'new' && <button className="button button-ghost" type="button" onClick={archive} disabled={state === 'saving'}>Archive product</button>}<span>Changes appear on the storefront after saving.</span></div>
    </form>
  </section>
}

function AdminPage({ account, authReady, onAuthenticate, onLogout, onCatalogChanged }) {
  const [dashboard, setDashboard] = useState(null)
  const [catalog, setCatalog] = useState([])
  const [view, setView] = useState('catalog')
  const [status, setStatus] = useState(authReady && !account ? 'idle' : 'loading')
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!authReady) {
      setDashboard(null)
      setStatus('loading')
      setError('')
      return undefined
    }
    if (!account) {
      setDashboard(null)
      setStatus('idle')
      setError('')
      return undefined
    }
    let cancelled = false
    setStatus('loading')
    setError('')
    Promise.all([loadAdminDashboard(true), loadAdminCatalog(true)]).then(([payload, catalogPayload]) => {
      if (cancelled) return
      setDashboard(payload)
      setCatalog(catalogPayload.products || [])
      setStatus('ready')
    }).catch((adminError) => {
      if (cancelled) return
      setError(adminError.message || 'The admin dashboard could not be loaded.')
      setStatus('error')
    })
    return () => { cancelled = true }
  }, [account?.uid, authReady, reloadKey])

  const saveOrder = async (changes) => {
    const payload = await updateAdminOrder(changes)
    setDashboard((current) => current ? { ...current, orders: current.orders.map((item) => item.orderId === payload.order.orderId ? payload.order : item) } : current)
  }

  const saveProduct = async (product, isNew) => {
    const payload = await saveAdminProduct(product, isNew)
    setCatalog(payload.products || [])
    onCatalogChanged(payload.products || [])
    return payload.product
  }

  const archiveProduct = async (id) => {
    const payload = await archiveAdminProduct(id)
    setCatalog(payload.products || [])
    onCatalogChanged(payload.products || [])
    return payload.product
  }

  const uploadProductImage = async (file) => (await uploadAdminProductImage(file)).image

  if (!authReady) return <main className="admin-page"><div className="page-shell"><div className="admin-state"><span className="eyebrow">Scudo / Store admin</span><h1>Verifying access…</h1><p>Checking your Firebase session and admin permissions.</p></div></div></main>
  if (!account) return <main className="account-page"><div className="account-card"><ScudoLogo size="sm" /><span className="eyebrow">Authorized team only</span><h1>Store administration.</h1><p>Sign in with a verified email listed in the secure admin configuration.</p><AuthForm onSuccess={onAuthenticate} /></div></main>
  if (status === 'error') return <main className="admin-page"><div className="page-shell"><div className="admin-state admin-state--error"><span className="eyebrow">Access unavailable</span><h1>Admin access was not granted.</h1><p>{error}</p><div><button className="button button-dark" type="button" onClick={() => setReloadKey((value) => value + 1)}>Retry access</button><button className="button button-ghost" type="button" onClick={onLogout}>Use another account</button></div></div></div></main>
  if (status !== 'ready' || !dashboard) return <main className="admin-page"><div className="page-shell"><div className="admin-state"><span className="eyebrow">Scudo / Store admin</span><h1>Verifying access…</h1><p>Checking your Firebase session and admin permissions.</p></div></div></main>

  const stats = [
    ['Total orders', dashboard.stats.totalOrders, 'all recorded orders'],
    ['Paid revenue', formatMoney(dashboard.stats.paidRevenue / 100), 'verified payments'],
    ['To fulfil', dashboard.stats.unfulfilled, 'paid and unfulfilled'],
    ['Customers', dashboard.stats.customers, 'unique email addresses']
  ]

  const activeCatalog = catalog.filter((product) => product.status !== 'archived')
  const lowStock = activeCatalog.filter((product) => product.inventory < 8 || product.isSoldOut)

  return <main className="admin-page"><div className="page-shell">
    <div className="admin-header"><div><span className="eyebrow">Scudo / Secure store admin</span><h1>Good morning, {dashboard.admin.name}.</h1><p>{dashboard.admin.email}</p></div><div className="admin-header__actions"><Link to="/shop" className="button button-ghost">View store</Link><button className="button button-ghost" onClick={onLogout}>Log out</button></div></div>
    <nav className="admin-navigation" aria-label="Admin sections"><button type="button" className={view === 'overview' ? 'is-active' : ''} onClick={() => setView('overview')}><span>01</span>Overview</button><button type="button" className={view === 'catalog' ? 'is-active' : ''} onClick={() => setView('catalog')}><span>02</span>Products <b>{activeCatalog.length}</b></button><button type="button" className={view === 'orders' ? 'is-active' : ''} onClick={() => setView('orders')}><span>03</span>Orders <b>{dashboard.orders.length}</b></button></nav>

    {view === 'overview' && <>
      <div className="admin-stats">{stats.map(([label, value, note]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>)}</div>
      <div className="admin-grid"><section className="admin-panel"><div className="panel-heading"><div><span className="eyebrow">Catalog / {activeCatalog.length}</span><h2>Product health</h2></div><button type="button" className="text-link" onClick={() => setView('catalog')}>Manage catalog <Icon name="arrow" size={14} /></button></div><div className="admin-products">{activeCatalog.slice(0, 10).map((product) => <div key={product.id}><CatalogImage src={product.shopImage || product.images[0]} sizes="45px" alt="" /><span>{product.name}<small>{product.category} · {product.sku}</small></span><strong className={product.inventory < 8 ? 'low-stock' : ''}>{product.isSoldOut ? 'Sold out' : `${product.inventory} in stock`}</strong></div>)}</div>{lowStock.length > 0 && <p>{lowStock.length} product{lowStock.length === 1 ? '' : 's'} need stock attention.</p>}</section><section className="admin-panel"><div className="panel-heading"><div><span className="eyebrow">Security</span><h2>Protected operations</h2></div><span className="status-pill">Verified</span></div><div className="admin-checklist">{['Firebase identity verified', 'Admin allow-list enforced', 'Catalog writes protected', 'Razorpay prices validated from catalog', 'Payment webhook signatures verified'].map((item) => <div key={item}><span className="check is-done"><Icon name="check" size={13} /></span>{item}</div>)}</div></section></div>
    </>}

    {view === 'catalog' && <AdminCatalogManager catalog={catalog} onSave={saveProduct} onArchive={archiveProduct} onUpload={uploadProductImage} />}

    {view === 'orders' && <section className="admin-panel admin-orders-panel admin-orders-panel--standalone"><div className="panel-heading"><div><span className="eyebrow">Orders / {dashboard.orders.length}</span><h2>Fulfilment queue</h2></div><span className="connection-status">Updated {new Date(dashboard.generatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></div>{dashboard.orders.length ? <div className="admin-orders">{dashboard.orders.map((order) => <AdminOrderEditor key={order.orderId} order={order} onSave={saveOrder} />)}</div> : <div className="admin-orders-empty"><span className="empty-mark">00</span><p>Orders will appear here after Razorpay creates them.</p></div>}</section>}
  </div></main>
}

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
  const [, setCatalogRevision] = useState(0)
  const [authReady, setAuthReady] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [authPrompt, setAuthPrompt] = useState(false)
  const [, setProfileSetupOpen] = useState(false)
  const [pendingAdd, setPendingAdd] = useState(null)
  const [order, setOrder] = usePersistedState('scudo-last-order', null)
  const profileRequired = Boolean(path !== '/admin' && account?.uid && !isCustomerProfileComplete(account))
  useRequiredProfileGuard(profileRequired)
  const applyCatalog = (catalog) => {
    const available = catalog.filter((product) => product.status !== 'archived' && product.visible !== false)
    replaceCatalogProducts(available)
    setCatalogRevision((value) => value + 1)
    setCart((current) => current.flatMap((item) => {
      const product = available.find((candidate) => candidate.id === item.product?.id)
      const quantity = Math.min(item.quantity, 5, Number(product?.inventory || 0))
      return product && quantity > 0 ? [{ ...item, product, quantity }] : []
    }))
  }
  useEffect(() => {
    let active = true
    loadStoreCatalog().then((catalog) => { if (active) applyCatalog(catalog) }).catch(() => { /* retain the bundled catalog when Functions are unavailable locally */ })
    return () => { active = false }
  }, [])
  useEffect(() => {
    let active = true
    const unsubscribe = watchFirebaseAuth(async (firebaseProfile) => {
      if (!active) return
      if (!firebaseProfile) {
        setOrder(null)
        setAccount(null)
        setProfileSetupOpen(false)
        setAuthReady(true)
        return
      }
      const profile = await loadCustomerProfile(firebaseProfile)
      if (!active) return
      setAccount(profile)
      setProfileSetupOpen(path !== '/admin' && !isCustomerProfileComplete(profile))
      setAuthReady(true)
    })
    return () => { active = false; unsubscribe() }
  }, [path, setAccount])
  useEffect(() => {
    if (path === '/admin') setProfileSetupOpen(false)
    else if (account?.uid && !isCustomerProfileComplete(account)) setProfileSetupOpen(true)
  }, [account, path])
  useEffect(() => {
    window.localStorage.removeItem('scudo-preferences')
    delete document.documentElement.dataset.motion
  }, [])
  useEffect(() => { document.title = path === '/' ? 'Scudo Clothing — Football-inspired streetwear' : `${path.replace('/', '').replaceAll('/', ' / ')} — Scudo Clothing` }, [route, path])
  const toggleWishlist = (id) => setWishlist((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  const addToCartNow = (product, size, color, quantity = 1) => { const key = `${product.id}-${size}-${color}`; const maxQuantity = Math.min(5, Number(product.inventory || 0)); if (maxQuantity < 1) return 'sold-out'; setCart((current) => { const existing = current.find((item) => item.key === key); return existing ? current.map((item) => item.key === key ? { ...item, quantity: Math.min(maxQuantity, item.quantity + quantity) } : item) : [...current, { key, product, size, color, quantity: Math.min(maxQuantity, quantity) }] }); setCartOpen(true); return 'added' }
  const finishPendingAdd = () => { if (pendingAdd) { addToCartNow(pendingAdd.product, pendingAdd.size, pendingAdd.color, pendingAdd.quantity); setPendingAdd(null) } }
  const addToCart = (product, size, color, quantity = 1) => {
    if (!account || !isCustomerProfileComplete(account)) {
      setPendingAdd({ product, size, color, quantity })
      if (account) setProfileSetupOpen(true)
      else setAuthPrompt(true)
      return account ? 'profile-required' : 'auth-required'
    }
    return addToCartNow(product, size, color, quantity)
  }
  const authenticate = async (firebaseProfile) => {
    setAuthPrompt(false)
    if (order?.ownerUid && order.ownerUid !== firebaseProfile.uid) setOrder(null)
    const profile = await loadCustomerProfile(firebaseProfile)
    setAccount(profile)
    if (!isCustomerProfileComplete(profile)) {
      if (path !== '/admin') setProfileSetupOpen(true)
      return profile
    }
    finishPendingAdd()
    return profile
  }
  const logout = async () => { const uid = account?.uid; await signOutFirebase(); clearCustomerProfileCache(uid); setOrder(null); setAccount(null); setProfileSetupOpen(false); setPendingAdd(null) }
  const saveProfile = async (details) => {
    const firebaseProfile = await updateFirebaseProfile({ name: details.name })
    const profile = await saveCustomerProfile(firebaseProfile, details)
    setAccount(profile)
    return profile
  }
  const completeProfileSetup = async (details) => {
    const profile = await saveProfile(details)
    setProfileSetupOpen(false)
    finishPendingAdd()
    return profile
  }
  const sendPasswordReset = () => sendFirebasePasswordReset(account?.email)
  const sendVerification = () => sendFirebaseVerificationEmail()
  const closeAuthPrompt = () => { setAuthPrompt(false); setPendingAdd(null) }
  const updateQuantity = (key, quantity) => setCart((current) => quantity < 1 ? current.filter((item) => item.key !== key) : current.map((item) => item.key === key ? { ...item, quantity: Math.min(quantity, 5, Number(item.product.inventory || 0)) } : item).filter((item) => item.quantity > 0))
  const removeCartItem = (key) => setCart((current) => current.filter((item) => item.key !== key))
  const quickAdd = (product) => { if (!product.isSoldOut) return addToCart(product, product.sizes[0], product.colors[0], 1); return 'sold-out' }
  const placeOrder = (data) => { const nextOrder = { ...data, ownerUid: account?.uid, number: data.number || `SC-${Date.now().toString().slice(-6)}`, createdAt: new Date().toISOString() }; setOrder(nextOrder); setCart([]); navigate('/order-confirmation') }
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const visibleOrder = account?.uid && order?.ownerUid === account.uid ? order : null
  let content
  if (path === '/') content = <HomePage wishlist={wishlist} onToggleWishlist={toggleWishlist} onQuickAdd={quickAdd} />
  else if (path === '/shop') content = <ShopPage wishlist={wishlist} onToggleWishlist={toggleWishlist} onQuickAdd={quickAdd} />
  else if (path === '/shop/jerseys') content = <ShopPage initialCategory="Jerseys" wishlist={wishlist} onToggleWishlist={toggleWishlist} onQuickAdd={quickAdd} />
  else if (path === '/shop/t-shirts') content = <ShopPage initialCategory="T-Shirts" wishlist={wishlist} onToggleWishlist={toggleWishlist} onQuickAdd={quickAdd} />
  else if (path.startsWith('/shop/')) {
    const slug = path.split('/').filter(Boolean).pop()
    const category = products.find((product) => categorySlug(product.category) === slug)?.category || slug.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
    content = <ShopPage initialCategory={category} wishlist={wishlist} onToggleWishlist={toggleWishlist} onQuickAdd={quickAdd} />
  }
  else if (path.startsWith('/product/')) { const product = products.find((item) => item.slug === path.split('/').pop()); content = product ? <ProductPage product={product} wishlist={wishlist} onToggleWishlist={toggleWishlist} onAddToCart={addToCart} /> : <main className="shop-page"><div className="page-shell"><EmptyState title="Product not found" copy="This product may have moved or is no longer available." action={<Link to="/shop" className="button button-dark">Browse the shop</Link>} /></div></main> }
  else if (path === '/collections') content = <CollectionsPage />
  else if (path === '/about') content = <InfoPage type="about" />
  else if (path === '/size-guide') content = <InfoPage type="size-guide" />
  else if (path === '/shipping-final-sale') content = <InfoPage type="shipping-final-sale" />
  else if (path === '/contact') content = <InfoPage type="contact" />
  else if (path === '/privacy') content = <InfoPage type="privacy" />
  else if (path === '/terms') content = <InfoPage type="terms" />
  else if (path === '/returns') content = <InfoPage type="returns" />
  else if (path === '/wishlist') content = <WishlistPage wishlist={wishlist} onToggleWishlist={toggleWishlist} onQuickAdd={quickAdd} />
  else if (path === '/cart') content = <CartPage cart={cart} onUpdateQuantity={updateQuantity} onRemove={removeCartItem} onCheckout={() => navigate('/checkout')} />
  else if (path === '/checkout') content = <CheckoutPage cart={cart} account={account} onPlaceOrder={placeOrder} />
  else if (path === '/order-confirmation') content = <OrderConfirmation order={visibleOrder} />
  else if (path === '/account') content = <AccountPage account={account} order={visibleOrder} onAuthenticate={authenticate} onLogout={logout} />
  else if (path === '/orders') content = <OrdersPage account={account} order={visibleOrder} />
  else if (path === '/settings') content = <SettingsPage account={account} onSaveProfile={saveProfile} onSendPasswordReset={sendPasswordReset} onSendVerification={sendVerification} onLogout={logout} />
  else if (path === '/admin') content = <AdminPage account={account} authReady={authReady} onAuthenticate={authenticate} onLogout={logout} onCatalogChanged={applyCatalog} />
  else content = <InfoPage type="about" />
  return <div className={`app ${showIntro ? 'app--intro' : ''}`}><span className="scroll-progress" aria-hidden="true" /><Header cartCount={cartCount} wishlistCount={wishlist.length} account={account} onCartOpen={() => setCartOpen(true)} />{content}<Footer /><CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} onUpdateQuantity={updateQuantity} onRemove={removeCartItem} onCheckout={() => { setCartOpen(false); navigate('/checkout') }} />{authPrompt && <AuthGate onClose={closeAuthPrompt} onAuthenticated={authenticate} />}{profileRequired && <DeliveryProfileSetup account={account} onSave={completeProfileSetup} />}{showIntro && !profileRequired && <BrandIntro onComplete={() => setShowIntro(false)} />}</div>
}
