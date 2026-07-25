# Scudo Clothing Storefront

A responsive React/Vite storefront foundation for Scudo Clothing. The experience is designed around an editorial football-inspired streetwear direction with a coded, image-free `ScudoLogo` component.

## Run locally

```bash
pnpm install
pnpm dev
```

Then open `http://127.0.0.1:4173/`.

## Build for production

```bash
pnpm build
pnpm preview
```

## What is included

- Responsive home, shop, collection, product, about, legal, customer-care, wishlist, cart, checkout, account, order-confirmation, and admin routes.
- Product data model with editable merchandising, inventory, SEO, material, and care fields in `src/App.jsx`.
- Reusable coded `ScudoLogo` supporting stacked, horizontal, mark, `S`, favicon-style, light, dark, and monochrome variants.
- Inline SVG shirt mark and live editable wordmark/subtitle text. No uploaded logo image is used.
- Local-storage cart and wishlist state.
- Search, category/size/colour filters, sorting, size-gated add-to-bag, cart drawer, checkout validation, and demo order confirmation.
- Demo admin gate with announcement editing, catalog snapshot, low-stock signal, and integration checklist.
- SEO basics in `index.html`, plus `public/robots.txt` and `public/sitemap.xml`.

## Connect production services

Copy `.env.example` to `.env` and add provider credentials only in the deployment environment. `VITE_PAYMENT_PROVIDER=demo` intentionally keeps checkout non-charging until Razorpay or Stripe is wired to a server-side payment flow. Supabase/Firebase can replace the demo account/admin gates, and object storage can replace the current editable remote image URLs.

Before launch, replace demo policies/contact details, validate product media/licensing, and add server-side inventory/order/payment handling.
