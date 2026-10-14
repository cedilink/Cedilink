# Cedilink Smartpay — Demo Runbook

How to run and record the final demo: a merchant creates a $25 payment, a customer pays it with Freighter, and Cedilink verifies it on Stellar Testnet.

Allow 15 minutes for setup the first time and about 3 minutes for the demo itself.

## Before the day

Do these once, well before recording.

| #   | Check                                | How                                                                                                                                                                                         |
| --- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The frontend is deployed and opens   | Visit the frontend address; the landing page loads.                                                                                                                                         |
| 2   | The backend is up                    | `https://credlink-api.pipeops.app/health` shows `{"ok":true}`.                                                                                                                              |
| 3   | Checkout links point at the frontend | On PipeOps, the backend's `APP_URL` is the frontend's address. If it is still `http://localhost:3000`, generated links only work on the machine running the frontend locally.               |
| 4   | You have a merchant account          | Create one at `/signup` (a Testnet wallet is created and funded for it), or use the seeded demo merchant: `SEED_MERCHANT_EMAIL` and `SEED_MERCHANT_PASSWORD` in the backend's `.env.local`. |
| 5   | Freighter is ready                   | See "Set up Freighter" below.                                                                                                                                                               |
| 6   | The customer wallet has funds        | In Freighter the account shows USDC and XLM. Each demo run spends 25 USDC. The USDC must be Circle's Testnet USDC (issuer `GBBD47IF…FLA5`), which is what the server accepts.               |

### Set up Freighter

1. Install the Freighter extension in Chrome from [freighter.app](https://www.freighter.app/) and create or unlock a wallet.
2. Open Freighter's settings and switch the network to **Testnet**.
3. Use a Testnet account that already holds Circle's Testnet USDC, or import the prepared customer account: choose "Import Stellar secret key" and paste `CUSTOMER_SECRET` from the backend's `.env.testnet`.
4. Select the imported account. It should show a USDC balance and an XLM balance.

This key is for Testnet only. Do not import it into a wallet you use for real funds, and do not show the secret key on a recording.

## The demo

Use one browser window with Freighter installed. Keep the dashboard in one tab and open the checkout in a second.

| Step | Do this                                                                                                                  | What the audience sees                                                                                                       |
| ---- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| 1    | Open the frontend address. Scroll a little.                                                                              | The landing page.                                                                                                            |
| 2    | Click **Try the Testnet demo** and create an account (or sign in).                                                       | The merchant overview, with Stellar USDC already connected.                                                                  |
| 3    | Click **Create payment**. Enter product `Ghana Web3 Conference Ticket` and amount `25.00`. Click **Generate checkout**.  | "Checkout created" with the link, payment ID and order ID.                                                                   |
| 4    | In the sidebar, open **Payments** and click the new payment. Leave this tab open.                                        | Status "Awaiting payment"; the six verification checks are not yet ticked.                                                   |
| 5    | On that page, copy the **Checkout link** row and open the link in a second tab.                                          | "Choose payment method" showing $25.00.                                                                                      |
| 6    | Click **Continue**, then **Connect Stellar Wallet**, then **Freighter**. Approve the connection in the Freighter pop-up. | The review screen: wallet, balance, recipient and network fee.                                                               |
| 7    | Click **Pay $25 USDC** and approve the transaction in Freighter.                                                         | "Processing payment…" with the three steps, then "Payment successful" a few seconds later.                                   |
| 8    | Click **View Transaction**.                                                                                              | The transaction on the Stellar explorer. This hash is the evidence the PRD asks for.                                         |
| 9    | Switch back to the dashboard tab.                                                                                        | The payment has turned "Paid" without a reload, all six checks are ticked, and the "Payment successful" notice is on screen. |

Points worth saying aloud:

- At step 7: the checkout shows success only after Cedilink has verified the payment on Stellar, not when the wallet reports it sent.
- At step 9: the six checks are what Cedilink compared against the payment request: the transaction exists and succeeded, and the destination, asset, amount and payment reference all match.

## Evidence to capture

- The screen recording of steps 1 to 9.
- The transaction hash, copied from the success screen or the payment details page.
- The explorer link from **View Transaction**.
- A screenshot of the payment details page showing "Paid" with the six checks.

## If something goes wrong

| What you see                                                                       | Cause                                                                                                                                               | Fix                                                                                                                               |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| "Freighter not found"                                                              | The extension is missing or disabled in this browser.                                                                                               | Install or enable Freighter, then choose **Choose another wallet** and pick Freighter again.                                      |
| "Wrong network or asset"                                                           | The screen says which: the wallet is on another network, or the selected account has not added the USDC the server accepts (Circle's Testnet USDC). | Switch the wallet to Testnet, or add the asset shown on screen. `npm run testnet:fund` in the backend folder can add and fund it. |
| "Not enough USDC"                                                                  | The demo customer account has run low.                                                                                                              | Use a smaller amount, or re-run the Testnet setup (below).                                                                        |
| "Payment expired"                                                                  | The checkout was created more than 30 minutes ago.                                                                                                  | Create a new payment.                                                                                                             |
| "Payment pending" for more than a minute                                           | Testnet is slow.                                                                                                                                    | Wait; the page updates on its own. Do not pay again.                                                                              |
| The checkout link opens `localhost`                                                | The backend's `APP_URL` is not set to the frontend's address.                                                                                       | Set it on PipeOps and restart the backend.                                                                                        |
| "Wrong network or asset" even though Freighter is on Testnet with the demo account | Stellar Testnet has been reset and the demo accounts no longer exist.                                                                               | Re-run the Testnet setup (below).                                                                                                 |

### Re-running the Testnet setup

Stellar Testnet is wiped from time to time. When that happens, in the backend folder:

1. `npm run testnet:setup` creates new accounts and writes them to `.env.testnet`.
2. `npm run db:seed` points the demo merchant at the new receiving wallet.
3. Import the new `CUSTOMER_SECRET` into Freighter.

Merchants who signed up before the reset have wallets that no longer exist; they need to set a new receiving wallet in Stellar USDC settings, or sign up again.

## Not covered by automated tests

Every step above passes in automated browser tests with a stand-in wallet. Two things have only ever been checked by hand, so try them before recording:

- A payment through the real Freighter extension (steps 6 and 7).
- The checkout on an actual phone. Freighter is a desktop extension, so on a phone the route is **Connect Stellar Wallet → Open in wallet app**: the page shows the amount, address and memo to send, and turns to success when the payment arrives. That flow is tested with a script standing in for the wallet app, not with a real one. The wallet app must be on Testnet and hold this environment's test USDC.
