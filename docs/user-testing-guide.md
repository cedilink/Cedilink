# Cedilink Smartpay — User testing guide

For the brief's user validation (at least 10 merchants or target users). Each session takes about 30 minutes. Everything runs on **Stellar Testnet**: no real money moves.

## Before the session (facilitator)

1. Make sure the tester has a merchant account, or create one at `/signup`. Sign-up creates and funds a Testnet receiving wallet.
2. Run the backend's scenario script for that merchant. It creates one payment link per flagged case and prints what to send for each:
   ```
   cd cedlink-backend && npm run scenarios -- tester@example.com
   ```
3. Have a Testnet customer wallet ready (Freighter, set to Testnet, with some XLM and test USDC). The checkout's "Get test USDC" button can fund it.
4. Deploy or run the frontend with `NEXT_PUBLIC_FEEDBACK=true`, so the **Feedback** button appears in the dashboard.

Write down the date, the tester's role (merchant, freelancer, event organiser, …) and their device.

## Tasks

Ask the tester to think aloud. Do not help unless they are stuck for more than two minutes; note where they got stuck.

| #   | Task                       | What the tester does                                                                                       | What should happen                                                                                                | Brief scenario |
| --- | -------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------- |
| 1   | Create a payment link      | Dashboard → **Create payment link**. Product, amount (10), optional customer reference.                    | A link is created and can be copied or shared.                                                                    | 11             |
| 2   | Pay it correctly           | Open the link, pay with Freighter.                                                                         | Checkout shows **Payment confirmed**; the dashboard shows it **Confirmed** and a "Payment received" notification. | 1, 14          |
| 3   | Pay too little             | From the wallet app, send **9 USDC** with the memo from the scenario script.                               | Checkout says the payment does not match; the link shows **Flagged · Underpaid**.                                 | 4              |
| 4   | Pay too much and accept it | Send **11 USDC** with the memo. In **Reconciliation**, open it and choose **Accept as paid**.              | The link becomes **Confirmed**; a "Payment verified" notification appears.                                        | 5              |
| 5   | Pay in the wrong asset     | Send **10 XLM** with the memo.                                                                             | **Flagged · Wrong asset**; Accept is not offered.                                                                 | 3              |
| 6   | Pay twice                  | Pay a link correctly, then send the same amount again with the memo.                                       | The second is **Flagged · Already paid**.                                                                         | 7              |
| 7   | Pay with no reference      | Send 10 USDC to the receiving wallet with no memo.                                                         | It appears under **Reconciliation → Unmatched · No reference**.                                                   | 9              |
| 8   | Wrong wallet               | Send 10 USDC with the memo to **another** account. On the link, use **Check a transaction** with the hash. | "This payment went to a different wallet".                                                                        | 2              |
| 9   | Find a transaction         | **Transaction history**: search by a customer reference, then filter by status and date.                   | Only matching rows remain.                                                                                        | 12             |
| 10  | Download a report          | **Download CSV** with a filter applied.                                                                    | A CSV opens in a spreadsheet with the filtered rows.                                                              | 13             |
| 11  | Cancel a link              | Open a pending link → **Cancel link**. Open the checkout link.                                             | The checkout says the link was cancelled.                                                                         | —              |
| 12  | Wallet problems            | Disconnect Freighter or switch it to Mainnet during checkout.                                              | A clear message and a way to recover.                                                                             | 15             |

## After each task

Ask the tester to press **Feedback** and record: the task, whether it worked, how easy it was (1–5), and anything confusing. Feedback is stored with the page and app version; export it with:

```
curl -H "x-admin-token: $FEEDBACK_ADMIN_TOKEN" https://<api>/v1/feedback.csv
```

## Evidence

At the end of all sessions, export every recorded transfer with its Testnet hash and explorer link:

```
cd cedlink-backend && npm run evidence -- tester@example.com evidence.csv
```

Summarise the sessions in `docs/validation-report.md`.
