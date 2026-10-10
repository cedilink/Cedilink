# Credlink Smartpay — Frontend Implementation Plan

Source: `CediLink SmartPay — Stellar Integration.pdf` (PRD) and the designs in `ui-assets/` (landing page, 16 customer checkout screens, 16 merchant screens, each in desktop and mobile).
Companion: `cedlink-backend/docs/plans/implementation-plan.md`, whose section 6 defines the API this app consumes.

## 1. What is being built

Three surfaces in one Next.js app:

| Surface | Route | Audience | Motion level |
|---|---|---|---|
| Landing page | `/` | Merchants evaluating Smartpay | High: scroll-driven, Apple and Awwwards calibre |
| Customer checkout | `/c/[paymentId]` | A payer with a Stellar wallet | Medium: state transitions that explain what is happening |
| Merchant dashboard | `/dashboard/*` | Signed-in merchant | Low: fast, quiet micro-interactions |

The motion budget is deliberately uneven. The landing page is where the showpiece animation lives. A checkout that makes someone wait for an animation before they can pay, or a dashboard that animates on every visit, would work against the product, so those two use motion only to show cause and effect.

## 2. Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js (latest stable, App Router), React 19, TypeScript strict | Scaffold with `create-next-app`. In Next 16, `params` and `searchParams` are async and `middleware.ts` is named `proxy.ts`. Check the current docs when scaffolding; do not rely on remembered APIs. |
| Styling | Tailwind CSS v4 | Tokens declared with `@theme` in `globals.css`; no `tailwind.config.js`. |
| Scroll animation | GSAP + ScrollTrigger + SplitText, via `@gsap/react` (`useGSAP`) | All GSAP plugins are free to use, including SplitText. |
| Smooth scroll | Lenis, driven by GSAP's ticker | Landing page only. |
| UI animation | Motion (`motion` package, `motion/react` import; the current name of Framer Motion) | `AnimatePresence`, layout animations, gestures. |
| Primitives | Radix UI (Dialog, Select, Accordion, Toast) styled with Tailwind | Accessible focus handling for the modal, selects and toasts. |
| Server state | TanStack Query + generated types from the backend OpenAPI document (`openapi-typescript`) | |
| Forms | React Hook Form + Zod | Create payment, settings. |
| Wallets | `@stellar/freighter-api`; `@albedo-link/intent` behind a flag | Behind one adapter interface (section 6). |
| Stellar | `@stellar/stellar-sdk`, imported only in the checkout route | Used for address validation and XDR handling; keep it out of the landing bundle. |
| Tests | Vitest + Testing Library, Playwright | |
| Hosting | Vercel, on `credlink.cc` | The API host is still to be decided; it is read from the server-side `API_URL` and never hard-coded. The browser calls `/api/*` on this origin, which Next.js forwards to the API, so the merchant session cookie stays first-party wherever the API is hosted. Checkout links are `https://credlink.cc/c/SP-00124`. |

### Which animation library does what

Using two animation libraries is only sound if each has a clear job:

- **GSAP** owns anything tied to scroll position or built as a timeline: pinning, scrubbing, text splitting, parallax. Used on the landing page.
- **Motion** owns anything tied to React state: mounting and unmounting, layout changes, modals, sheets, toasts, hover and press. Used in the checkout and dashboard, and for the landing FAQ and navigation.
- They never animate the same element.

## 3. Design system

Colour values are read off the design PDFs and are approximate; confirm them with the designer. The typeface is confirmed as Manrope.

| Token | Approximate value | Use |
|---|---|---|
| `--color-brand` | `#2330BE` | Primary buttons on landing and dashboard, links, step numbers |
| `--color-brand-tint` | `#E8EAF8` | Hero panel, CTA band, device frames |
| `--color-ink` | `#242424` | Checkout primary button, large amounts |
| `--color-heading` | `#4D4D4D` | Landing section headings |
| `--color-muted` | `#6B7280` | Body copy, labels |
| `--color-surface` | `#F7F7F7` | Page background in checkout and dashboard, cards on landing |
| `--color-card` | `#FFFFFF` | Cards |
| Status: paid / awaiting / confirming / failed, expired | green / amber / blue / red tints | Status pills |
| Radius | 16–24px cards, full pills for buttons and inputs | |
| Type | Manrope (Google Font), tight tracking on display sizes | Load with `next/font/google` as a single variable font |

Shared components (`components/ui`): `Button` (brand, ink, outline, ghost), `Card`, `StatusPill`, `CopyButton`, `KeyValueList`, `Input`, `Select`, `Dialog`, `BottomSheet`, `Toast`, `Spinner`, `EmptyState`, `Skeleton`.

Formatting helpers (`lib/format.ts`): `truncateAddress` (`GBXK…7QLM`), `truncateHash` (`9f3c…a81e`), `formatUsdc`, `formatDateTime`.

## 4. Structure

```
cedlink-frontend/
  src/
    app/
      layout.tsx                      fonts, providers
      (marketing)/
        layout.tsx                    Lenis + GSAP providers (client), nav, footer
        page.tsx                      landing sections
      c/[paymentId]/
        page.tsx                      server: fetch checkout, render shell
        checkout.tsx                  client: state machine + screens
        loading.tsx  error.tsx  not-found.tsx
      dashboard/
        layout.tsx                    sidebar, top bar, mobile drawer, SSE toasts
        page.tsx                      overview
        payments/page.tsx             list
        payments/new/page.tsx         create payment
        payments/[paymentId]/page.tsx details
        payment-methods/stellar-usdc/page.tsx
        error.tsx
      login/page.tsx
    components/
      ui/                             primitives above
      marketing/                      Hero, Statement, Steps, CheckoutScene, DashboardScene,
                                      VerifyScene, WalletScene, UseCases, TestnetBand, Faq, FinalCta
      checkout/                       one component per screen + CheckoutCard shell
      dashboard/                      Sidebar, StatCard, MethodCard, PaymentsTable, VerificationList…
      motion/                         SplitReveal, Parallax, Magnetic, CountUp, DrawCheck, Mascot, LayeredArt
    assets/                           photos/, illustrations/ (extracted from the design PDFs)
    lib/
      api/                            generated types, fetch client, query keys
      wallets/                        adapter interface, freighter.ts, albedo.ts
      checkout/                       machine.ts (reducer), error mapping
      motion/                         gsap.ts (plugin registration), easings.ts, lenis.tsx
      format.ts  env.ts
```

Server Components fetch initial data (checkout details, payments list); client components take over for wallet interaction and live updates.

## 5. Landing page

### 5.1 Sections, in design order

1. **Nav** — wordmark, How it works, For merchants, FAQs, "Try the Testnet demo".
2. **Hero** — tinted copy panel on the left, cloud photograph with a phone showing the checkout on the right.
3. **Statement** — "Your business. A new way to be paid."
4. **How it works** — three numbered cards.
5. **A clear checkout. No new account.** — copy plus the review-payment phone screen.
6. **Know where every payment stands.** — browser frame with the dashboard overview.
7. **The details match. The proof is on-chain.** — verification.
8. **A wallet. Some USDC. A little XLM.**
9. **Real business needs.** — three photo cards.
10. **Try the flow. Not real money.** — Testnet band.
11. **FAQ** — five questions.
12. **Final CTA** and footer.

Product UI shown inside phones and browser frames is built as real DOM components reused from the checkout and dashboard, not screenshots. It stays sharp at any size and its parts can be animated individually.

### 5.2 Motion specification

Shared rules: easing `expo.out` / `power3.out` for reveals, 0.8–1.2s durations, 60–90ms staggers, only `transform`, `opacity` and `clip-path` animated. Lenis provides inertia scrolling and is connected to ScrollTrigger so pinned scenes stay in sync.

| Section | Animation | Technique |
|---|---|---|
| Page load | Short intro: wordmark fades, then the two hero panels open from the centre outward with a `clip-path` wipe | GSAP timeline, runs once |
| Nav | Hides on scroll down, returns on scroll up; background blurs in after the hero | ScrollTrigger direction callback |
| Hero headline | Lines rise from behind a mask, staggered | SplitText (`type: "lines"`, `mask: "lines"`) |
| Hero visual | Cloud image scales from 1.15 to 1 and drifts slower than the page; phone rises with a slight overshoot; the `$25.00` counts up | Timeline + scrubbed parallax |
| Hero exit | As the user scrolls, the phone continues upward and the copy panel fades at a different rate | Scrubbed ScrollTrigger |
| Statement | Words fill from pale to full colour as the block crosses the viewport | SplitText words, opacity scrubbed with stagger. The Apple product-page text treatment. |
| How it works | Cards rise in sequence; the numbers `01 02 03` roll into place | ScrollTrigger batch |
| **Checkout scene** (centrepiece) | The section pins. As the user scrolls, the phone steps through the real flow: checkout → wallet modal → review → approval → processing → success, while the copy on the left changes with each step and a progress rail advances | Pinned ScrollTrigger with a scrubbed master timeline and labels per step; snap to labels |
| Dashboard scene | The browser frame starts at 85% scale with a slight tilt and settles flat at full width; stat values count up; method cards stagger in | Scrubbed scale + triggered timeline |
| Verification | The six checks tick one after another with drawn check marks; a transaction hash types out | SVG stroke animation on scroll |
| Wallet essentials | The three nouns in the heading reveal in turn, each paired with an icon that drops in | SplitText + stagger |
| Use cases | Images revealed with a `clip-path` wipe, the image inside moving against the frame; on hover the image scales slightly | ScrollTrigger + CSS hover |
| Testnet band | Background tint expands from the centre | Scrubbed `clip-path` |
| FAQ | Height-animated accordion, icon morphs between plus and minus | Motion (`AnimatePresence`, `layout`) |
| Final CTA | Headline line reveal; the button is magnetic and follows the cursor within a small radius | SplitText + pointer-driven `quickTo` |
| CTA buttons | Label slides up and is replaced by a duplicate on hover | CSS |

### 5.3 Imagery and illustration motion

Every photograph and illustration in the designs has been extracted from the PDFs into `cedlink-frontend/assets/` (move to `src/assets/` when the app is scaffolded, so they can be statically imported and get blur placeholders from `next/image`). `assets/manifest.json` lists each file's size and, for layered art, each layer's bounding box for setting transform origins.

Two illustrations were split into separate transparent layers on a shared canvas, so their parts can move independently. Stack the layers with absolute positioning and they line up without any offsets.

| Asset | Used in | Animation |
|---|---|---|
| `photos/hero-clouds.jpg` | Hero background | **Load:** revealed by a `clip-path` wipe while scaling from 1.25 to 1. **Ambient:** a slow horizontal drift on a 40-second loop, so the sky is never static. **Scroll:** moves at about 60% of page speed. **Pointer (desktop):** shifts a few pixels opposite to the cursor while the phone shifts with it, which gives the two a sense of depth. Stretch goal: a WebGL displacement pass that ripples the clouds with scroll velocity. The source is only 1152×928, so keep the scale-up modest or ask the designer for a larger original. |
| `photos/hero-portrait.jpg` | Hero avatar stack (the same portrait is used four times in the design; ask for three more) | Avatars start stacked on one point and fan out with a staggered spring; the "+" chip rotates in last. On hover the stack spreads a little further. |
| `photos/use-case-*.jpg` (three) | "Real business needs" cards | **Enter:** each frame opens with an inset `clip-path` wipe while the photo inside settles from 1.3 to 1, staggered across the three cards. **Scroll:** the photo drifts vertically inside its frame. **Hover:** photo scales to 1.06 and a small "Try the flow" label follows the cursor. **Mobile:** a snap-scrolling row with the same reveal per card. |
| `illustrations/wallet-layers/` (`base`, `float-1` coin with sparkle, `float-2` coin) | Card payment method on the landing dashboard scene, checkout screen 01, dashboard method card | **Enter:** the base rises and settles with a soft overshoot, then the two floating pieces drop in from above and bounce once. **Ambient:** the floating pieces bob on out-of-phase loops (about 12px, a few degrees of rotation). **Pointer:** each layer shifts by a different amount, the floating pieces most. **Checkout:** when the Card row is selected, the coins hop once. In the dashboard the art is static apart from a hover lift. |
| `illustrations/mascot-layers/` (`brow-left`, `brow-right`, `eye-left`, `eye-right`, `nose`, `smile`, on background `#FFF4E2`) | Merchant avatar and brand mark in checkout and dashboard | A small character with states. **Idle:** blinks at random intervals of 3–6 seconds (eyes squash vertically). **Pointer:** eyes shift up to a few pixels toward the cursor. **Hover:** brows lift. **Checkout processing:** eyes glance side to side. **Success:** brows up, smile widens, one bounce. **Failed or expired:** brows tilt inward, smile flattens. All changes are springs under 400ms. |
| `illustrations/stellar-logo.png` | Stellar USDC method row and cards | Spins a full turn with a spring when the Stellar method is selected; a ring pulses around it while the payment is "Confirming on Stellar". This file is a raster crop from the design; use Stellar's official SVG mark in production, which also allows the orbit lines to be drawn on. |
| `illustrations/bitcoin.png` | Crypto method row and card | Flips in on its vertical axis on first appearance; hover lift only after that. |
| `illustrations/success-badge.svg` | Checkout success screen, landing verification scene | The tinted circle scales up from the centre with a spring, the scalloped outline is revealed by a rotating sweep, then the check mark draws and a short ring of lines bursts outward. The exported outline is a filled shape, so the sweep is done with a mask; redrawing it as a stroked path (a small job) allows a true line-drawing effect. |
| `illustrations/high-five.svg` | "Payment successful" toast in the dashboard | The two figures slide in from either side, the hands meet, and the three spark lines above them pop out in sequence. The file is a direct PDF export with wrapper groups and a white background; it needs one clean-up pass (group the two figures and the sparks, drop the background) before the parts can be animated separately. |

Rules that apply to all of the above: ambient loops pause when the element is off screen (`IntersectionObserver` or ScrollTrigger `toggleActions`) and when the tab is hidden; pointer effects are desktop-only; under reduced motion everything is shown in its final state with no loops.

### 5.4 Making it hold up in practice

- **Reduced motion**: all GSAP setup lives inside `gsap.matchMedia()`. With `prefers-reduced-motion: reduce`, Lenis is off, nothing pins, and content appears with a plain fade.
- **Mobile**: the pinned checkout scene becomes a horizontally swipeable sequence of steps; parallax distances are halved; the cursor-following effects are desktop-only. The mobile design is the reference for layout.
- **Performance targets**: LCP under 2.5s on a mid-range phone, CLS under 0.05, no long tasks from animation setup. The hero photograph is served through `next/image` with `priority`; other images lazy-load. GSAP and Lenis load only in the `(marketing)` layout.
- **No flash of unstyled animation**: elements that animate in are hidden with CSS from first paint and revealed by GSAP, with a `<noscript>` override so the page is readable without JavaScript.
- **Cleanup**: every animation is created inside `useGSAP` with a scope, so route changes revert it; SplitText instances are re-split on resize after fonts load.
- **Content stays in the DOM**: headings are real text, split at runtime with `aria-label` preserved, so the page remains indexable and readable by screen readers.

## 6. Customer checkout

### 6.1 Wallet adapter

```ts
interface WalletAdapter {
  id: 'freighter' | 'albedo';
  isAvailable(): Promise<boolean>;
  connect(): Promise<{ address: string }>;
  getNetwork(): Promise<{ passphrase: string } | null>;
  signTransaction(xdr: string, opts: { networkPassphrase: string; address: string }): Promise<string>;
}
```

- **Freighter** (MVP): `isConnected` → `requestAccess` → `getNetworkDetails` → `signTransaction`. Not installed, user rejection and wrong network each map to their own screen.
- **Albedo**: implemented against the same interface and switched on by `NEXT_PUBLIC_ALBEDO_ENABLED`. The designs include both "Coming soon" and "Enabled" variants of the wallet modal, so the flag selects between them.
- The frontend never submits to Stellar. It signs and hands the envelope to the backend.

### 6.2 State machine

One reducer (`lib/checkout/machine.ts`) drives the whole flow. Each state renders exactly one design screen.

| State | Screen | Enters when | Leaves by |
|---|---|---|---|
| `selectMethod` | 01 Payment Selection | Checkout loads with more than one method | Continue |
| `summary` | 02 SmartPay Checkout | Stellar USDC chosen | Connect Stellar Wallet |
| `walletSelect` | 03 Wallet Selection (modal) | CTA pressed | Pick wallet, close |
| `walletNotInstalled` | 16 Freighter not found | Adapter unavailable | Install link, choose another |
| `connectionRejected` | 16 Connection rejected | User declines in wallet | Try again, choose another |
| `wrongNetwork` | 12 Wrong network or asset | Wallet passphrase is not Testnet, or preflight reports no account or trustline | Try again, another method |
| `insufficientUsdc` | 08 | Preflight | Try again, another method |
| `insufficientXlm` | 09 | Preflight | Try again, another method |
| `review` | 04 Wallet Connected and Review | Preflight passes | Pay, Disconnect |
| `awaitingApproval` | 05 Waiting for Wallet Approval | Pay pressed; XDR fetched; wallet prompt open | Signed, Cancel |
| `processing` | 06 Processing | Signed envelope submitted | Status events |
| `pending` | 11 Payment pending | Still unconfirmed after about 30 seconds, or page reloaded mid-confirmation | Status events, Refresh status |
| `success` | 07 Success | Backend reports `PAID` | View Transaction, Return to Merchant |
| `failed` | 10 Transaction failed | Backend reports `FAILED` | Try again |
| `expired` | 13 Payment expired | Backend reports `EXPIRED`, on load or mid-flow | Return to Merchant |
| `alreadyPaid` | 14 Already paid | Checkout loads with status `PAID` | View Transaction, Return to Merchant |
| `walletDisconnected` | 15 Wallet disconnected | Wallet account changes or locks during review | Reconnect, Cancel |

Rules:

- **Success is shown only when the backend says `PAID`.** A signed or submitted transaction moves the UI to `processing`, never to `success`.
- The three processing steps map to backend statuses: Payment initiated = `PAYMENT_INITIATED`, Transaction submitted = `TRANSACTION_SUBMITTED`, Confirming on Stellar = `CONFIRMING`.
- Status arrives over SSE (`/checkout/:id/events`), with polling of `/status` every 3 seconds as a fallback.
- The initial state is derived from the server-fetched status, so reloading the page at any point lands on the correct screen (`pending`, `success`, `expired`, `alreadyPaid`).
- A `REBUILD_REQUIRED` response fetches a new transaction and returns to `awaitingApproval` without showing an error.
- Backend error codes map to states in one table (`lib/checkout/errors.ts`), mirroring the backend's Horizon error mapping.

### 6.3 Layout and motion

Layout: a single centred card (about 400px) on desktop, full-width with bottom-anchored actions on mobile. The wallet picker is a centred dialog on desktop and a bottom sheet on mobile.

| Moment | Animation (Motion) |
|---|---|
| Between steps | The card resizes smoothly to its new content (`layout`), while the content cross-fades with a small vertical offset (`AnimatePresence mode="wait"`). Forward and back use opposite directions. |
| Amount | The `$25.00` figure shares a `layoutId` across screens, so it travels and resizes instead of disappearing and reappearing. |
| Wallet modal | Scale and fade with a spring on desktop; draggable bottom sheet with dismiss-on-swipe on mobile. |
| Waiting for approval | A soft pulsing ring around the wallet icon. |
| Processing | Each step's spinner morphs into a check as its status arrives; the connecting line fills downward. |
| Success | The success badge plays its reveal (section 5.3), the mascot reacts, and the receipt rows stagger in. One restrained burst, no looping confetti. |
| Errors | The icon enters with a short horizontal shake; nothing else moves. |
| Copy buttons | Icon swaps to a check for 1.5 seconds. |

All of it respects reduced motion through Motion's `MotionConfig reducedMotion="user"`.

### 6.4 Details from the designs to resolve in code

- Review screen shows "G… (placeholder) — Recipient wallet address not supplied." In the build, the recipient is always the merchant's receiving address from the backend, truncated, with copy.
- Success shows "Network: Stellar"; elsewhere it is "Stellar Testnet". Use the network name from the API everywhere so Testnet is never mistaken for real funds.
- "View Transaction" opens the explorer URL returned by the API in a new tab. "Return to Merchant" uses the payment's `returnUrl` and is hidden when there is none.
- Card and Crypto appear as selectable methods on screen 01 but are not built. Show them disabled with a "Not available in this demo" note, or hide screen 01 when only Stellar is enabled.

## 7. Merchant dashboard

| Screen | Route | Notes |
|---|---|---|
| Overview / Overview empty | `/dashboard` | Four stat cards; three method cards. Empty state shows "Stellar USDC is not enabled yet" with an enable CTA. |
| Stellar USDC settings | `/dashboard/payment-methods/stellar-usdc` | Enable toggle, network badge, receiving wallet input with inline validation errors from the API (invalid address, account not found, no USDC trustline), accepted wallets. |
| Create payment | `/dashboard/payments/new` | Product, amount, currency (USDC only), method, order ID (prefilled, editable), destination (read-only from settings), optional customer name and email. |
| Checkout generated | same route, success state | Link, payment ID, order ID, amount, network; Copy link, Open checkout, Create another. |
| Payments list | `/dashboard/payments` | Search, six filter tabs with counts, table on desktop and stacked cards on mobile; populated, empty and no-results states. Filter and search live in the URL query. |
| Payment details | `/dashboard/payments/[paymentId]` | Status pill with explanation line; information list; six verification rows; explorer link. Variants: awaiting, confirming, paid, failed, expired, duplicate flagged. |
| Generic error | `error.tsx` | "Something went wrong" with Try again. |
| Success notification | layout-level | Toast driven by the merchant SSE stream: "Payment successful · $25.00 USDC · CD-2026-00124". |

Shell: fixed sidebar on desktop (Overview, Payments with count, Checkouts, All methods, Stellar USDC, Settings, Help & Support, user menu), collapsing to a drawer behind the menu icon on mobile.

Data: lists and details are fetched on the server for first paint and hydrated into TanStack Query. An SSE `payment.updated` event invalidates the affected queries, so a details page open on "Confirming" turns to "Paid" on its own, and its verification rows tick as it does.

Motion, kept minimal: stat values count up on first load only; table rows fade in with a short stagger; the active filter tab's highlight slides between tabs (`layoutId`); the sidebar's active indicator slides; skeletons instead of spinners; the toast springs in from the bottom right and its high-five illustration plays once (section 5.3); status pills cross-fade when status changes.

### Design details to resolve

- The domain is `credlink.cc`. The designs show `credi.link` in the browser bar and `smartpay.cedilink.com/c/…` as the checkout link; always display the `checkoutUrl` returned by the API.
- The brand is **Credlink** / **Credlink Smartpay**. The designs and PRD spell it "CediLink SmartPay", and the Overview and Settings screens say "PayVia"; replace all of these in UI copy.
- The Overview header has two buttons labelled "Refresh"; the primary one (with the plus icon) is "Create payment", as on the Payments list.
- The Payments list with the notification is titled "Payment details"; it should read "Payments".
- The breadcrumb reads "Workspace / Overview" on every screen; make it reflect the current page.
- Sidebar items "Checkouts", "All methods", "Settings" and "Help & Support" have no designs. "Checkouts" can link to the payments list filtered to open ones; the rest are disabled for the MVP.
- No login screen is designed; build a minimal one in the checkout's card style.

## 8. Delivery plan

Mapped to the PRD's four weeks. Weeks 1 and 2 use mocked API responses (MSW, generated from the OpenAPI document) so work does not wait on the backend.

### Week 1 — Foundations and landing page
1. Scaffold Next.js, Tailwind v4 tokens, font, lint, CI, Vercel preview deployments.
2. UI primitives and formatting helpers.
3. Landing page static build, desktop and mobile, with real DOM device mock-ups.
4. Motion infrastructure: GSAP registration, Lenis provider, `SplitReveal`, `Parallax`, `Magnetic`, `CountUp`.
5. Landing animations for hero, statement, steps, use cases, FAQ, CTA.

**Exit:** landing page complete except the pinned checkout scene; component library in place.

### Week 2 — Checkout and wallet
1. Checkout shell and all 16 screens as static components, viewable in a state gallery route for design review.
2. State machine with unit tests for every transition.
3. Freighter adapter; connect, network check, sign.
4. Wire preflight, transaction, submit against the backend; step transitions and shared-amount animation.

**Exit:** a customer can connect Freighter and submit a Testnet USDC transaction (PRD week 2 deliverable).

### Week 3 — Dashboard and live status
1. Dashboard shell, login, overview, settings.
2. Create payment → checkout generated.
3. Payments list with filters and search; payment details with all variants.
4. SSE for checkout status and merchant notifications; reload-recovery for the checkout.
5. Landing page pinned checkout scene and dashboard scene, reusing the now-finished components.

**Exit:** the full demo story works: create a $25 payment, open the link, pay with Freighter, see "Payment successful" on both sides.

### Week 4 — Test, polish, demo
1. Playwright suite covering the PRD test list (below) with a stubbed wallet adapter.
2. Real-device pass on iOS Safari and Android Chrome; reduced-motion pass; keyboard and screen-reader pass on checkout.
3. Performance pass on the landing page against the targets in 5.4.
4. Albedo adapter if time allows.
5. Deploy; record the demo.

## 9. Test plan

| Case | Check |
|---|---|
| Successful payment | Reaches screen 07 only after the backend reports `PAID`; hash links to the explorer |
| Failed transaction | Screen 10; Try again returns to review |
| Insufficient USDC / XLM | Screens 08 / 09 with the balance figures from preflight |
| Wrong network or asset | Freighter on Mainnet, or account without trustline → screen 12 |
| Duplicate / already paid | Opening a paid link shows screen 14; merchant details shows the duplicate flag |
| Expired payment | Screen 13 on load and when expiry passes mid-flow |
| Wallet disconnect / reconnect | Screen 15, then back to review after reconnect |
| Connection rejected, Freighter missing | Both screen 16 variants |
| Reload during processing | Lands on pending or success, never back at the start |
| Mobile checkout | Every screen at 390px; bottom sheet; no horizontal scroll |
| Dashboard | Create → list → details; filter and search; empty and error states; toast on payment |

Unit tests: state machine, error mapping, formatters. The wallet adapter interface makes the Playwright suite independent of a real browser extension.

## 10. Risks

| Risk | Mitigation |
|---|---|
| **Freighter is a desktop browser extension.** A customer opening the checkout link in a phone browser has no Freighter to connect to, yet the PRD requires a mobile checkout. | The mobile layout is built regardless. For a working mobile payment, Albedo (a web wallet, no extension) is the shortest path, which makes it more valuable than the PRD's "if feasible" suggests. Until then, mobile shows the "Freighter not found" screen with guidance. Decide in week 1. |
| Landing animation hurts performance on low-end Android phones, which matter for this market | Simplified mobile choreography, transform-only animation, measured against targets on a real mid-range device in week 4 |
| Pinned scroll scenes feel like scroll-jacking | One pinned scene only, short pin distance, snap to steps, disabled under reduced motion |
| Backend not ready when UI needs it | MSW mocks generated from the shared OpenAPI document |
| Colour values inferred from PDFs | Confirm tokens with the designer before week 1 ends |
