# Credlink Smartpay — Frontend

Next.js app for Credlink Smartpay: the customer checkout and the merchant dashboard, with the landing page to come.

Plan and rationale: [docs/plans/implementation-plan.md](docs/plans/implementation-plan.md). Designs: `ui-assets/`.

## Run

```bash
npm install
cp .env.example .env.local    # set API_URL to the backend
npm run dev                   # http://localhost:3000
```

`API_URL` is the backend's base address (for example `https://credlink-api.pipeops.app`, or
`http://localhost:4000`). The browser never calls it directly: requests go to `/api/*` on this app and
are forwarded, which keeps the merchant session cookie first-party.

## What is built

| Route | Status |
|---|---|
| `/c/[paymentId]` | Customer checkout: all 16 designed screens, Freighter wallet, live status |
| `/` | Placeholder; landing page to come |
| `/login`, `/dashboard/*` | Merchant dashboard: overview, payments list and details, create payment, Stellar USDC settings, live updates |

### Checkout

- `src/lib/checkout/machine.ts` is the state machine: one state per designed screen. The success
  screen is reachable only when the backend reports the payment as paid.
- `src/lib/checkout/use-checkout.ts` connects the machine to the wallet and the API.
- `src/lib/wallets/` holds one adapter per wallet behind a shared interface. Freighter is on;
  Albedo is implemented and switched on with `NEXT_PUBLIC_ALBEDO_ENABLED=true`.
- `src/components/checkout/` holds the screens.

### Dashboard

- Pages under `src/app/dashboard/` fetch through `src/lib/dashboard/queries.ts` (TanStack Query).
- `src/components/dashboard/toasts.tsx` listens to the merchant event stream: every update refreshes
  what is on screen, and a payment turning paid raises the "Payment successful" toast.
- Sign in with the demo merchant seeded by the backend (`npm run db:seed` there).

To pay from a browser, install Freighter, switch it to Testnet, and import the customer secret key
from the backend's `.env.testnet`.

## Checks

| Command | What it covers |
|---|---|
| `npm run typecheck`, `npm run lint` | Types and lint |
| `npx vitest run` | Checkout state machine |
| `node scripts/checkout-browser-check.mjs` | The checkout in Chrome, end to end against a running backend on Testnet |
| `node scripts/dashboard-browser-check.mjs` | The dashboard in Chrome, including a live payment arriving; expects a freshly seeded database |

The checkout check replaces the Freighter extension (which cannot be automated) with a stand-in that
signs with the Testnet customer key. It needs the frontend started with `NEXT_PUBLIC_TEST_WALLET=true`,
and `FRONTEND_URL` / `API_URL` pointing at the running servers. Never set that flag in production.

## Contract with the backend

`src/lib/api/schema.d.ts` is generated from the backend's `openapi.json`. After the API changes:

```bash
npm run api:types
```
