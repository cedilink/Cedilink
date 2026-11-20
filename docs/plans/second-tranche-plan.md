# Cedilink Smartpay — Frontend Plan, Second Tranche

Source: `CediLink Smart Pay – Second Brief.pdf` (the brief) and these new designs in `ui-assets/`:

- `NEW DESIGNS — CediLink SmartPay · 8 screens.pdf`: Dashboard with the notifications panel, Link management, Reconciliation (Unmatched tab with flagged detail), Reconciliation (Matched tab). Each comes in desktop and mobile.
- `customer-ui/Checkout and wallet.pdf`: the checkout screens with the new hand-drawn illustration along the bottom.
- `src/assets/illustrations/new-illustration.svg`: that illustration (1438×241, five hands holding a phone, cards, cash, a coin, and pointing).
- `merchant-ui/Merchant.pdf` (20 Nov): adds **Transaction history** (desktop and mobile) and the mobile Dashboard. The other screens in it are the tranche-one designs, unchanged.
- `customer-ui/Approval and confirmation.pdf` and `customer-ui/Payment exceptions.pdf` (20 Nov): every existing checkout status and error screen, now with the illustration.
- `docs/designs/second-tranche/` in this repo: the screens no designer file covers yet, drawn in the same visual language (open `index.html`). See section 11.

Builds on: `implementation-plan.md` in this folder.
Companion: `cedlink-backend/docs/plans/second-tranche-plan.md`. Its section 6 defines every endpoint used here, and its section 3 lists the decisions (D1–D7) referred to below.

## 1. What changes

| Area                | Change                                                                                                                                                                                                            | Design                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Dashboard shell     | New navigation: Workspace (Dashboard, Transaction history, Link management), Payment operations (Reconciliation, Stellar USDC), Other (Settings, Help & Support). Breadcrumb, info and bell icons in the top bar. | All four new screens                                                              |
| Dashboard           | Four new stat cards, a Recent activity table, the notifications panel                                                                                                                                             | Dashboard                                                                         |
| Link management     | Replaces the Payments list: link, amount, status, created date, Copy, Share, View                                                                                                                                 | Link management                                                                   |
| Reconciliation      | New page: Matched and Unmatched tabs, expected against received, checks, flagged detail                                                                                                                           | Reconciliation ×2                                                                 |
| Transaction history | New page: one row per payment request with its latest transaction; search, filters, CSV download, explorer links                                                                                                  | Merchant.pdf (Transaction history); detail page in `docs/designs/second-tranche/` |
| Payment details     | Adds expected against received, every transfer, Cancel link, Check a transaction                                                                                                                                  | `docs/designs/second-tranche/payment-details.html`                                |
| Create payment      | Adds an asset field (USDC only, D2) and an optional Customer reference                                                                                                                                            | `docs/designs/second-tranche/create-payment.html`                                 |
| Statuses            | Pending, Confirmed, Failed, Expired, Cancelled, Flagged everywhere                                                                                                                                                | All                                                                               |
| Notifications       | Stored, with an unread dot; live over SSE                                                                                                                                                                         | Dashboard (panel)                                                                 |
| Checkout            | Illustration along the bottom of every screen; header and copy updates; clearer timeout, failure and mismatch guidance; a Cancelled screen                                                                        | Checkout and wallet                                                               |
| User testing        | Feedback widget, tester guide, validation report                                                                                                                                                                  | —                                                                                 |

## 2. Reading the new designs

### 2.1 Dashboard

- Header: "Dashboard", with the subtitle "Stellar Testnet · Merchant workspace".
- Four stat cards:
  - **Verified payments**: `$2,450`, with "USDC · 32 transactions" under it.
  - **Pending requests**: `8`, "Awaiting customer payment".
  - **Unmatched payments**: `3`, "Review in Reconciliation".
  - **Links created**: `24`. The notifications panel hides this card on desktop, but the mobile design shows it.
- **Recent activity**: "Latest requests and payment checks". The table has Request reference, Amount and Status, and each row is its own rounded card.
- **Notifications panel**: drops down from the bell. Each item has a title, a one-line detail and a coloured dot (green for received, red for unmatched, dark for expired).

### 2.2 Link management

- Header: "Link Management", with the subtitle "24 payment links · Stellar Testnet".
- A full-width search: "Search links or request reference".
- Columns:
  - **Payment link**: two lines, "CDL-001 · Conference ticket" and the URL in brand blue.
  - **Amount**, **Status**, **Created** (`09 Oct 2026`).
  - **Actions**: Copy and Share as tinted pills, then a View link.
- Statuses shown:
  - Confirmed: green.
  - Pending: lavender with a clock.
  - Failed and Flagged: red.
  - Expired and Cancelled: grey, with a struck-clock icon.
- Mobile: one card per link (reference and product, amount large, status pill top right, Copy and Share, date bottom right).

### 2.3 Reconciliation

- Header: "Reconciliation", with the subtitle "Verify payments against your requests · Stellar Testnet".
- A two-button toggle at the top right, "Matched · 32" and "Unmatched · 3". The active button is filled brand blue. Add a third, "Resolved · 4", for decided items (`reconciliation-resolved.html`).
- Columns: Request, Expected vs Received (`90 → 100`), Asset, Recipient check, Tx hash, Status.
  - A mismatched asset is red (`XLM → USDC`). "Matches" is green. Hashes are truncated and in brand blue.
- The Unmatched tab adds a "2 of 3 unmatched payments shown" line, and a **Flagged detail** card. It has a title line ("Received 100 USDC against 90 USDC expected."), then four rows (Recipient, Asset, Amount, Reference). Each row has a sentence and a green or red dot, and the failing row is outlined.
- The Matched tab has the footnote "Verified recipient, asset, amount and reference".
- Mobile: the same content as cards, with the detail card below the list.

### 2.4 Checkout

The layouts are unchanged from tranche one. What is new:

- **The illustration** runs along the bottom of every checkout screen:
  - Desktop: across nearly the full width, below the card.
  - Mobile: scaled up and anchored bottom-left, so about three and a half hands show, partly behind the card.
  - It sits under the dimmed overlay when the wallet modal or sheet is open.
- Header titles: "Choose payment method" (01), "Awaiting Payment" (the summary screen, today titled "Smartpay"), "Review Payment" (04 on mobile, but "SmartPay" on desktop; use "Review Payment" on both).
- The wallet picker ends with the note "Use USDC on Stellar Testnet. Keep testnet XLM in your wallet for fees." On mobile it lists "Open in wallet app · On your phone". Both the Albedo "Coming soon" and "Enabled" variants appear again.
- The desktop review screen shows "Disconnect" under the wallet address. That already exists.

### 2.5 Design details to resolve in code

| In the design                                                                                                                                                                | Build                                                                                                                                                                | Reason                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| "CediLink SmartPay" in the sidebar                                                                                                                                           | "Cedilink Smartpay"                                                                                                                                                  | Brand spelling (see the tranche-one plan)           |
| `credi.link` in the browser bar, `smartpay.cedilink.com/c/CDL-001` as links                                                                                                  | Always show the `checkoutUrl` from the API (`https://www.cedilink.com/c/…`)                                                                                          | The real domain                                     |
| `CDL-001` references                                                                                                                                                         | Show the ID the API returns (`SP-00124` today)                                                                                                                       | Depends on D1                                       |
| `90 → 100` under "Expected vs Received", while the detail card says "Received 100 USDC against 90 USDC expected", and the brief's sample reads "90 USDC · Expected 100 USDC" | Keep the arrow, always as expected → received; the asset follows the received amount; the mismatched side is red; give the column an `aria-label` that spells it out | The three sources disagree on which number is which |
| Every mobile link card reads "CDL-001 · Conference ticket · 120 USDC"                                                                                                        | Real data                                                                                                                                                            | Placeholder repetition                              |
| "2 of 3 unmatched payments shown"                                                                                                                                            | Paginate ("Show more"), and show the total in the toggle                                                                                                             | The third item must not be unreachable              |
| No create button on the Dashboard, though the brief asks for "Quick payment-link creation"                                                                                   | A "Create payment link" pill in the page header, as on today's Overview                                                                                              | Brief requirement                                   |
| No status filter on Link management, though the brief asks to "view expired or cancelled requests"                                                                           | A row of status chips under the search (All, Pending, Confirmed, Flagged, Failed, Expired, Cancelled) using the existing sliding-tab component                       | Brief requirement                                   |
| No resolve actions in the flagged detail                                                                                                                                     | "Accept as paid" and "Dismiss" buttons under the four rows (D4), with a confirm dialog and an optional note                                                          | Otherwise a flag can never be cleared               |
| No transaction detail, Payment details, empty, loading or error designs                                                                                                      | Drawn in `docs/designs/second-tranche/`; build from those and send them to the designer to confirm (section 11)                                                      | The brief's designer deliverables include them      |
| "Recipient: Matches receiving wallet G…XXXX"                                                                                                                                 | The merchant's real receiving address, truncated, with copy                                                                                                          | Placeholder                                         |

## 3. Routes and navigation

| Nav item            | Route                                                                                            | Replaces                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| Dashboard           | `/dashboard`                                                                                     | Overview                                                        |
| Transaction history | `/dashboard/transactions`, `/dashboard/transactions/[transferId]` (backend `GET /transfers/:id`) | —                                                               |
| Link management     | `/dashboard/links`, `/dashboard/links/new`, `/dashboard/links/[paymentId]`                       | `/dashboard/payments`, `/payments/new`, `/payments/[paymentId]` |
| Reconciliation      | `/dashboard/reconciliation?tab=unmatched&item=<id>`                                              | —                                                               |
| Stellar USDC        | `/dashboard/payment-methods/stellar-usdc`                                                        | unchanged                                                       |
| Settings            | `/dashboard/settings`                                                                            | unchanged                                                       |
| Help & Support      | `mailto:` link, or disabled as today                                                             | —                                                               |

- Permanent redirects from the old `/dashboard/payments/*` paths in `next.config.ts`, because emails already sent link to them. The backend updates its email links in the same release.
- The badge next to Transaction history is the total transaction count. Reconciliation gets a red count badge when anything is unmatched (not in the design, but it is the one number that needs action).
- The sidebar search (⌘/) goes to Transaction history when the text looks like a transaction hash (64 hex characters). Otherwise it goes to Link management with `?q=`.
- The breadcrumb reads "Workspace / <page>", or "Payment operations / Reconciliation" for that section.
- Mobile: the existing drawer behind the menu icon, with the new groups. The bell stays in the mobile header, as designed.

## 4. Screens

### 4.1 Dashboard (`/dashboard`)

- Data: `GET /overview` (`verified`, `pendingRequests`, `unmatched`, `linksCreated`, `recentActivity`).
- Stat cards count up on first load only, as today.
- "Unmatched payments" links to Reconciliation. It turns red when the count is above zero.
- "Pending requests" links to Link management filtered to Pending. "Links created" links to all links.
- Recent activity rows link to the payment details page. "View all" goes to Link management.
- When Stellar USDC is not enabled, the stats are replaced by the existing "Stellar USDC is not enabled yet" card and its enable button. The Card and Crypto method cards are dropped, because the new design has no method cards.
- Empty state (enabled, no links yet): an illustration, "Create your first payment link", and the create button.

### 4.2 Link management (`/dashboard/links`)

- Data: `GET /payments`, with `q`, `status` and `cursor` kept in the URL.
- **Copy** copies `checkoutUrl`, and the icon swaps to a check for 1.5 seconds (existing `CopyButton`).
- **Share** uses `navigator.share({ title, text, url })` where available (most phones). Otherwise it opens a small menu with Copy link, WhatsApp (`https://wa.me/?text=`) and Email (`mailto:`).
- **View** opens the details page.
- Expired and cancelled rows keep Copy, but grey out Share, because a dead link should not be shared.
- Desktop: a table where each row is a card, as designed. Mobile: stacked cards.
- Infinite "Load more" using the cursor.

### 4.3 Create payment (`/dashboard/links/new`)

Unchanged, except for:

- An **Asset** select with only "USDC (Stellar Testnet)" (D2), sent as `asset`.
- "Product or service" gets the helper text "Shown to your customer as the description".
- The success state is unchanged (link, copy, open, create another), plus Share.

### 4.4 Payment details (`/dashboard/links/[paymentId]`)

Extends the existing page:

- The status pill uses `displayStatus`. The explanation line is from `statusMessage`.
- **Expected and received.** Expected is the amount, asset and recipient wallet. Received comes from the matched transfer. It shows the brief's "Display expected and received amounts, wallet, asset, and reference".
- **Transfers.** A list of every transfer attributed to this request (`transfers[]`). Each shows the state pill, expected against received, the hash with explorer link, and the time. A flagged one links to its Reconciliation detail.
- **Cancel link.** Shown for pending, failed and flagged requests that have nothing in flight. A confirm dialog reads "Customers will no longer be able to pay this link." A `CANNOT_CANCEL` response is shown inline.
- **Check a transaction.** A small form: paste a hash, then `POST /check-transaction`, and the result appears in Transfers. For "the customer says they paid".
- The verification rows stay, but are relabelled to the brief's terms: Recipient, Asset, Amount, Reference, Transaction successful, Found on Stellar.

### 4.5 Reconciliation (`/dashboard/reconciliation`)

- Data: `GET /reconciliation?state=matched|unmatched`. The toggle shows both counts. The selected item is kept in the URL (`item=`) so a notification can deep-link to it.
- Unmatched opens on the first unresolved item, with the detail card visible, as designed.
- Columns as designed. "Request" shows the payment ID, or "No reference" or "Unknown reference" for transfers that matched nothing. Those rows show the sender's wallet in the detail card instead of a reference.
- **Flagged detail** card: the title sentence from `reasonMessage`, then the four check rows. Each has a dot (green or red) and a plain sentence:

  | Check     | Passing                              | Failing                                        |
  | --------- | ------------------------------------ | ---------------------------------------------- |
  | Recipient | "Matches receiving wallet GBXK…7QLM" | "Sent to GABC…1234, not your receiving wallet" |
  | Asset     | "USDC matches USDC"                  | "XLM received, USDC expected"                  |
  | Amount    | "100 expected · 100 received"        | "90 expected · 100 received — mismatch"        |
  | Reference | "SP-00124 matches request reference" | "No reference on this transaction"             |

  The failing row gets the outlined treatment from the design. Below the rows: **Accept as paid** (hidden for wrong-asset and wrong-recipient transfers, as the API refuses them) and **Dismiss**, each with a confirm dialog and an optional note. Once resolved, the card shows who resolved it, when, the note, and the item moves to Matched (accepted) or out of the default view (dismissed). A "Show dismissed" chip brings dismissed items back.

- Desktop: the detail card sits under the table, as designed. On wide screens (≥1440px) it can move to a right-hand column so the table stays in view.
- Mobile: the cards as designed. Tapping one opens the detail as a bottom sheet (the existing `BottomSheet`), rather than making the merchant scroll past the list.
- Live: a `transfer.recorded` SSE event refreshes the counts and the list.

### 4.6 Transaction history (`/dashboard/transactions`)

Designed in `Merchant.pdf`. **Each row is a payment request, not an incoming transfer**: the design shows `CDL-002 · Pending · Not submitted`, a request nobody has paid yet. Transfers that match no request live only in Reconciliation.

- Columns, as designed: Request / customer (request reference over the customer reference, e.g. `CDL-001` / `CUS-101`; falls back to the customer's name, then "—"), Amount, Asset, Status (`displayStatus` pill), Date, Transaction / actions (latest transaction hash with a "Stellar explorer ↗" link, or "Not submitted"), View.
- A request with more than one transfer shows the latest; the detail lists them all.
- **Search** placeholder, as designed: "Search hash, request ref, customer ref". Matches transaction hash, request reference, order ID, customer reference, customer name and email.
- **Filters**, as designed: Date, Amount, Asset, Status pill dropdowns.
  - Date: Today, Last 7 days, Last 30 days, or a custom pair of native `<input type="date">`.
  - Amount: min and max.
  - Status: Pending, Confirmed, Flagged, Failed, Expired, Cancelled.

  Mobile shows the four dropdowns in two rows above a full-width Download CSV button, as designed, and each row becomes a card with "Stellar explorer ↗" and "View details". Active filters are kept in the URL.

- **Download CSV** is a plain link to `/api/reports/transactions.csv?<current filters>`. The browser downloads it through the existing `/api` proxy with the session cookie. Its label can show the count ("Download CSV · 32 rows"); over 50,000 it says the export will be capped.
- **View** → the request's Payment details. The transaction hash → `/dashboard/transactions/[transferId]` (`transaction-detail.html`): the four check rows, every raw field (ledger time, operation ID, memo, sender), the linked request, and the resolve actions when flagged.
- Empty and no-results states as in `states.html`.

### 4.7 Notifications

- The bell shows a dot when `unreadCount > 0`. Clicking opens the panel from the design: newest 10, each with its title, detail and dot colour, plus "Mark all as read" and "View all" in the footer. "View all" opens a simple `/dashboard/notifications` page with paging.
- Opening the panel does not mark items read. Clicking an item marks it read and navigates:
  - Received, pending, failed or expired → payment details.
  - Unmatched → Reconciliation with that item selected.
  - Verified → payment details.
- Dot colours: green for received and verified, brand for pending, red for failed and unmatched, dark for expired.
- Live: `notification.created` over the existing merchant SSE connection prepends the item and sets the dot. The existing "Payment successful" toast with the high-five stays for `payment_received` only, so the merchant isn't toasted for every event.
- Accessibility: the panel is a Radix Popover, the bell has `aria-label="Notifications, 2 unread"`, and new items are announced through the existing `aria-live` region.
- Mobile: the same panel, full width under the header, as designed.

## 5. Shared components and tokens

| Component                               | Change                                                                                                                                                                                                                                                                             |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `StatusPill`                            | Driven by `displayStatus`: Confirmed (paid tint), Pending (brand tint, clock icon), Failed (failed tint), Flagged (failed tint, alert icon), Expired and Cancelled (neutral grey, struck-clock icon). The pending stage adds "Confirming" as a secondary label where space allows. |
| `ReconciliationPill`                    | New: Matched, Flagged, Unmatched, Failed                                                                                                                                                                                                                                           |
| `CheckRow`                              | New: label, sentence, pass/fail dot, outlined when failing. Used by Reconciliation, transaction detail and payment details.                                                                                                                                                        |
| `ExpectedReceived`                      | New: `90 → 100` with the asset, mismatch in red, accessible label                                                                                                                                                                                                                  |
| `HashLink`                              | New: truncated hash, copy, explorer link                                                                                                                                                                                                                                           |
| `FilterBar`, `FilterSheet`, `DateRange` | New, URL-backed (`useSearchParams` + `router.replace`)                                                                                                                                                                                                                             |
| `ShareButton`                           | New (4.2)                                                                                                                                                                                                                                                                          |
| `RowCard` table                         | Extract the "each row is a card" table style from the new designs, used by Dashboard, Links, Reconciliation and Transactions                                                                                                                                                       |
| `EmptyState`, `Skeleton`, `LoadError`   | Reused; every new page gets all three                                                                                                                                                                                                                                              |

New tokens: `--color-neutral-tint` and `--color-neutral` for expired and cancelled. Pending uses the existing `--color-brand-tint`. The Link management design uses grey (`#ececec` on `#4d4d4d`) for both.

## 6. Checkout changes

### 6.1 The illustration

- Optimise `new-illustration.svg` (102 KB) with SVGO and check it renders the same. Then import it statically as an `<Image unoptimized>` with `alt=""`, `aria-hidden`, and `pointer-events-none`.
- The new designs pin it to the bottom of the screen **behind** the card: on mobile the card and its button overlap the hands, and on the Confirmed screen the card covers them almost entirely. Build it that way: `absolute bottom-0` inside the checkout page's `relative overflow-hidden` full-height container, `z-0`, with the card at `z-10`. Give the content column enough bottom padding (about 150px mobile, 200px desktop) that the last button never ends up over the hands' busiest part on a short screen, and keep `pointer-events-none` so the hands can never take a tap.
- Desktop: width about 90% of the viewport, capped at the SVG's natural 1438px, centred.
- Mobile: a fixed crop, about 760px wide anchored bottom-left, so the phone, card and cash hands show. The designs crop it slightly differently on each screen; use one crop everywhere so it doesn't shift between steps.
- The card stays on top (`z-10`). The modal and bottom-sheet overlays dim it like everything else.
- It applies to every checkout screen, including the status and error screens, and to the loading skeleton, so the page doesn't jump when data arrives.
- Motion, kept restrained (the checkout motion level is "medium" in the tranche-one plan): on the first load only, the five hands rise from below, staggered 60 ms apart, with a soft spring. They stay still after that. On the success screen, the pointing hand can do one small wave. Nothing loops. Under reduced motion it is static.
  - To animate hands separately, the SVG must be split into five groups. It is currently one `clip-path` group. Do that once and keep the split file in `assets/illustrations/checkout-hands/`, or skip the per-hand motion.
- Keep it off the landing page and the dashboard. It belongs to the checkout.

### 6.2 Copy and header updates

- The summary screen title becomes "Awaiting Payment". The review title becomes "Review Payment" on desktop too.
- Add the Testnet fees note to the wallet picker, if it is missing.

### 6.3 Error handling the brief asks for

Most of this exists. The work is making sure each case reads clearly, and filling the three gaps.

| Brief item                                                    | Today                                                      | Work                                                                                                                                                                                                                                                |
| ------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wallet connection errors (unsupported or disconnected wallet) | Screens 15 (disconnected) and 16 (rejected, not installed) | Unsupported browser or phone: say plainly "Freighter works in desktop Chrome, Firefox and Brave", and point to "Open in wallet app".                                                                                                                |
| Insufficient balance                                          | Screens 08 and 09, with balances from preflight            | Unchanged. Make sure the "Get test USDC" top-up is offered on 08 on Testnet.                                                                                                                                                                        |
| Incorrect network                                             | Screen 12 after the network check                          | Re-check the network when the window regains focus during review, so switching Freighter to Mainnet mid-flow is caught before signing.                                                                                                              |
| Transaction timeout                                           | Screen 11 (pending) after about 30 s                       | After 2 minutes, add guidance: "Stellar usually confirms in seconds. You can close this page; the merchant will be notified when it confirms." Add Refresh status and the explorer link. Never offer to pay again while a transaction is in flight. |
| Failed payment feedback                                       | Screen 10 with the backend's reason                        | Map failure codes to plain sentences with a next step each (see `lib/checkout/errors.ts`), for example "Your wallet does not hold this USDC. Add the asset, then try again." Then a Try again button.                                               |
| _(new)_ Cancelled link                                        | —                                                          | A Cancelled screen, styled like Expired: "This payment link was cancelled. Contact <merchant> for a new link."                                                                                                                                      |
| _(new)_ Payment received but does not match                   | —                                                          | When `lastTransfer` is flagged (backend 6.6), show "We received 90 USDC, but this payment needs 100 USDC." with "Contact the merchant before sending more." For the wallet-app route, where this can happen.                                        |

## 7. Data layer

- Regenerate `src/lib/api/schema.d.ts` from the backend's `openapi.json` once backend Phase 2 lands. Until then, build against fixtures written from the examples in backend section 6.
- New query keys: `links(filters)`, `transactions(filters)`, `transfer(id)`, `reconciliation(state)`, `notifications`. Filters are serialised once (`lib/dashboard/filters.ts`) and used both for the query key and the URL, so they cannot drift.
- `LiveUpdates` handles three SSE events:
  - `payment.updated` invalidates links, overview and payment.
  - `transfer.recorded` invalidates reconciliation, transactions and overview.
  - `notification.created` prepends to the notifications cache.
- The CSV is downloaded directly through the proxy (4.6). Check that Next's rewrite streams the response and passes `Content-Disposition` through. If it doesn't, add a route handler that pipes it.

## 8. User validation (brief Deliverable 3)

The brief needs at least 10 merchants or target users, with documented evidence. The frontend owns the testing materials:

- **`docs/user-testing-guide.md`**: the brief's ten tasks as step-by-step scripts:
  1. Wallet connection.
  2. Link creation.
  3. Checkout and payment.
  4. Confirmation.
  5. Transaction history.
  6. Search and filtering.
  7. CSV report.
  8. Errors and recovery.
  9. Notification clarity.
  10. Overall usability.

  Each script lists what the tester does, what they should see, and the questions to ask. The flagged cases use the backend's `scripts/scenarios.ts`.

- **Feedback widget**: a small "Give feedback" button on the dashboard and on checkout end screens, behind `NEXT_PUBLIC_FEEDBACK=true`. Clicking it opens a short form: which task, did it work, a rating from 1 to 5, and a comment. It posts to `POST /feedback`. It is off in normal use.
- **Evidence screenshots**: extend the existing browser checks (`scripts/*-browser-check.mjs`) so each run saves a screenshot of every dashboard state and checkout error state, at desktop and 390px widths. These are the "screenshots of matched and unmatched payments" and "wallet and payment error test results" the brief lists.
- **`docs/validation-report.md`**: a template with the brief's required sections:
  - Participants and test dates.
  - Scenarios completed.
  - Successful and failed transactions (hashes).
  - Screenshots.
  - Feedback.
  - Issues.
  - Fixes.
  - Final summary.

  Fill it in during testing.

## 9. Delivery plan

The phases follow the backend's, so pages are built against fixtures first and wired up when the API lands.

### Phase 1 — Start now, no backend dependency (about 1 week)

1. The checkout illustration, header titles and copy (section 6.1–6.2), plus a pass over each checkout screen against the new sheet at desktop and 390px.
2. The new shell: navigation groups, routes and redirects, breadcrumb, bell (static), sidebar search routing.
3. Shared components from section 5, with the new status tokens.
4. Dashboard, Link management and Reconciliation pages against fixtures.

**Exit:** the four new designs are reproduced with fixture data, on desktop and mobile; the checkout shows the illustration on every screen.

### Phase 2 — Wire to the API (about 1 week, after backend Phase 2)

1. Regenerate types; replace fixtures with queries.
2. Transaction history with filters and CSV, plus the transaction detail page.
3. Payment details additions: transfers, Cancel link, Check a transaction.
4. Resolve actions on Reconciliation.
5. Create payment asset field and Share.

### Phase 3 — Notifications and error handling (about 3–4 days, after backend Phase 3)

1. Notifications panel, page and live events.
2. Checkout error work from section 6.3, including the Cancelled and "payment does not match" screens.

### Phase 4 — User testing (about 1–2 weeks of calendar time)

1. Tester guide, feedback widget, screenshot capture.
2. Sessions with at least 10 participants.
3. Fix critical issues, re-test, fill in the validation report.
4. Deliver the brief's final items: the updated repositories, the deployed URL, transaction evidence and the validation report.

## 10. Test plan

| Brief scenario                                           | Frontend check                                                                                                                                                                  |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 Correct payment                                        | Checkout reaches Success only after `PAID`; the link shows Confirmed; Reconciliation shows it under Matched with green checks                                                   |
| 2–5 Wrong recipient, wrong asset, under- and overpayment | Each appears under Unmatched with the right red row and sentence; the link shows Flagged; the dashboard Unmatched count goes up; Accept is hidden for wrong asset and recipient |
| 6 Unconfirmed                                            | Checkout stays on Processing or Pending, with the timeout guidance after 2 minutes                                                                                              |
| 7 Failed                                                 | Checkout screen 10 with the plain-language reason; the link shows Failed; it is not counted in Verified                                                                         |
| 8 Duplicate                                              | The second transfer shows as Flagged "Already paid"; the request stays Confirmed                                                                                                |
| 9 No reference                                           | An Unmatched row with "No reference" and the sender's wallet                                                                                                                    |
| 10 Restart                                               | (backend)                                                                                                                                                                       |
| 11 Link created                                          | The new link appears at the top of Link management; Copy and Share work                                                                                                         |
| 12 Search and filter                                     | Each filter and the search narrow the list; the URL reproduces the view on reload                                                                                               |
| 13 CSV                                                   | The download starts, and the rows match the filtered list                                                                                                                       |
| 14 Notification                                          | The bell dot appears and the item reads correctly; clicking navigates to the right place                                                                                        |
| 15 Wallet disconnected or wrong network                  | Screens 15 and 12, including a network switch mid-review                                                                                                                        |
| 16 Ten users                                             | Validation report                                                                                                                                                               |

Plus:

- Unit tests: `displayStatus` → pill, filter serialisation, `ExpectedReceived` formatting, error-code mapping.
- Browser checks for each new page at 390px with no horizontal scroll.
- Keyboard and screen-reader passes on the notifications panel, the filter sheet and the resolve dialogs.
- A reduced-motion pass on the checkout illustration.

## 11. Ask the designer for

The brief lists "error, empty, loading, and success states" and "interactive prototype and developer handoff" as designer deliverables. Transaction history is now designed. The rest is drawn in `docs/designs/second-tranche/` in the designer's visual language, so it can be built now; send the folder to the designer to confirm or restyle:

| Gap                                                                                                           | Interim design                                                                                            |
| ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Transaction detail                                                                                            | `transaction-detail.html`                                                                                 |
| Payment details in the new sidebar, with expected vs received, transfers, Cancel link and Check a transaction | `payment-details.html`, `check-transaction.html`                                                          |
| Accept as paid / Dismiss and the resolved state                                                               | `reconciliation.html`, `accept-dialog.html`, `reconciliation-resolved.html`, `reconciliation-mobile.html` |
| Empty, loading and error states for the new pages                                                             | `states.html`                                                                                             |
| Checkout Cancelled and "payment does not match"                                                               | `checkout-cancelled.html`, `checkout-mismatch.html`                                                       |
| Customer reference field on Create payment                                                                    | `create-payment.html`                                                                                     |
| Notifications panel types and deep links                                                                      | `notifications.html`                                                                                      |

Still for the designer:

1. "Match to a payment link" for a transfer with no reference (it can't be accepted as paid; nothing is drawn yet).
2. The illustration split into five layers, if the hands are to move separately, and made identical on every screen (some cuffs come and go between screens).
3. Copy fixes in the checkout files: "Processing confirmed" → "Payment confirmed"; "Smart Pay" → "SmartPay".
4. The Duplicate payment Payment details design marks "Payment reference matches" as failed; a duplicate is a reused transaction hash, so that check should pass and a separate "Transaction not already used" check should fail.
5. The tranche-one screens in `Merchant.pdf` still say "PayVia", use the old sidebar, and show "Workspace / Overview" as every breadcrumb.

Pill colours are settled by Link management: Confirmed green, Pending blue, Failed and Flagged red, Expired and Cancelled grey.

## 12. Risks

| Risk                                                              | Mitigation                                                                                                  |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Pages wait on the backend                                         | Phase 1 builds against fixtures written from the backend contract                                           |
| The illustration hurts checkout performance on low-end phones     | SVGO, a static file, no animation after first load, and checked against the tranche-one performance targets |
| Testers struggle to produce flagged cases from a wallet           | The backend scenarios script prints exact instructions; the tester guide walks through each case            |
| Design gaps (section 11) are filled differently later             | Interim versions reuse existing components, so restyling is cheap                                           |
| Redirecting `/dashboard/payments` breaks bookmarks or email links | Permanent redirects cover every old path, including details pages                                           |
