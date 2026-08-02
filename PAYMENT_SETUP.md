# Scudo Razorpay payment setup

The storefront uses Razorpay Standard Checkout with Netlify Functions. The browser never receives the Razorpay key secret, never decides the payable amount, and cannot mark an order as paid by itself.

## Security model

- `POST /api/payments/order` validates every product, option, quantity, and customer field, recalculates the total from `src/productCatalog.js`, creates the Razorpay order, and stores the trusted record in Netlify Blobs.
- `POST /api/payments/verify` verifies the Razorpay HMAC using the server-stored order ID, fetches the payment directly from Razorpay, and checks the linked order, amount, currency, and captured status.
- `POST /api/payments/webhook` verifies the signature against the untouched raw request body and deduplicates events using `x-razorpay-event-id`.
- The order-creation and verification functions are rate-limited by IP and domain.
- Payment pages use a restrictive Content Security Policy and additional browser security headers from `netlify.toml`.

## 1. Create Razorpay test credentials

In the Razorpay Dashboard, switch to **Test Mode**, then create an API key pair. Keep the key secret private. Never put it in React code, a `VITE_*` variable, Git, screenshots, chat, or browser storage.

## 2. Link the local folder to the Netlify site

Run from CMD:

```cmd
cd /d E:\clothing
npm install -g netlify-cli
netlify login
netlify link
```

## 3. Store secrets on Netlify

The safest option is Netlify → Project configuration → Environment variables, where you can paste each value and mark it as secret. If you use the CLI, replace the placeholders below; be aware that inline values can remain in terminal history.

```cmd
netlify env:set RAZORPAY_KEY_ID "rzp_test_REPLACE_ME" --scope functions --context production --secret
netlify env:set RAZORPAY_KEY_SECRET "REPLACE_WITH_TEST_KEY_SECRET" --scope functions --context production --secret
netlify env:set RAZORPAY_WEBHOOK_SECRET "REPLACE_WITH_A_SEPARATE_WEBHOOK_SECRET" --scope functions --context production --secret
```

The required variables are:

- `RAZORPAY_KEY_ID` — Razorpay test or live key ID.
- `RAZORPAY_KEY_SECRET` — matching Razorpay key secret; Functions scope only when your Netlify plan supports scopes.
- `RAZORPAY_WEBHOOK_SECRET` — a separate strong secret chosen when configuring the webhook.
- `PAYMENT_ALLOWED_ORIGIN` — optional comma-separated custom origins if checkout is served from an additional trusted domain.

The existing `VITE_RAZORPAY_KEY_ID` variable is not used by this integration and can be removed. The public key ID is returned only after the server creates a valid order.

## 4. Configure Razorpay

1. Enable automatic payment capture in Razorpay Dashboard → Account & Settings → Payment Capture.
2. Create a Test Mode webhook pointing to:

   `https://YOUR-DOMAIN/api/payments/webhook`

3. Use the same value for the dashboard webhook secret and `RAZORPAY_WEBHOOK_SECRET`.
4. Subscribe to `payment.captured`, `payment.failed`, and `order.paid`.
5. Do not fulfil an order unless Razorpay marks it captured/paid.

## 5. Test locally and deploy

Vite alone does not run Netlify Functions. Use Netlify Dev for payment testing:

```cmd
cd /d E:\clothing
netlify dev
```

Run the automated checks separately:

```cmd
pnpm run test:payments
pnpm run build
pnpm audit --prod
```

Make successful, failed, cancelled, and duplicate-click payments using Razorpay Test Mode. Check Netlify function logs and the Razorpay dashboard after every case.

## 6. Go live safely

1. Complete Razorpay account activation and KYC.
2. Repeat all tests with Test Mode keys.
3. Replace the three Netlify variables with Live Mode values and redeploy.
4. Create the webhook again in Live Mode; Razorpay Test and Live webhooks are configured separately.
5. Rotate any credential immediately if it is ever exposed.
6. Monitor Razorpay transactions, webhook deliveries, Netlify function logs, and rate-limit events.

## Remaining production requirement

The current storefront account and admin demonstrations use browser storage and are not secure identity systems. Razorpay payments are server-verified, but customer account history and administrative access should be migrated to a real authenticated database such as Supabase before treating those areas as production-ready. Inventory is currently a static catalogue value rather than a transactional stock reservation, so add database-backed inventory locking before operating at a volume where simultaneous purchases could oversell an item.

Official references:

- https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/
- https://razorpay.com/docs/webhooks/validate-test/
- https://docs.netlify.com/build/functions/get-started/
- https://docs.netlify.com/build/functions/environment-variables/
- https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/
