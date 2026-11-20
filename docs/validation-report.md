# Cedilink Smartpay — Validation report

Template for the brief's Deliverable 3. Fill one row per participant and per issue; attach the exports listed at the end.

## Summary

- Sessions: _N_ participants between _date_ and _date_.
- Completion: _x_ of _y_ tasks completed without help (_z_%).
- Average ease rating: _r_ / 5.
- Main findings: _three bullet points_.

## Participants

| #   | Date | Role | Device and wallet | Tasks completed | Notes |
| --- | ---- | ---- | ----------------- | --------------- | ----- |
| 1   |      |      |                   | / 12            |       |
| 2   |      |      |                   | / 12            |       |
| 3   |      |      |                   | / 12            |       |
| 4   |      |      |                   | / 12            |       |
| 5   |      |      |                   | / 12            |       |
| 6   |      |      |                   | / 12            |       |
| 7   |      |      |                   | / 12            |       |
| 8   |      |      |                   | / 12            |       |
| 9   |      |      |                   | / 12            |       |
| 10  |      |      |                   | / 12            |       |

## Results by task

| #   | Task (see user-testing-guide.md) | Completed | Needed help | Average ease | Common problems |
| --- | -------------------------------- | --------- | ----------- | ------------ | --------------- |
| 1   | Create a payment link            |           |             |              |                 |
| 2   | Pay it correctly                 |           |             |              |                 |
| 3   | Pay too little                   |           |             |              |                 |
| 4   | Pay too much and accept it       |           |             |              |                 |
| 5   | Pay in the wrong asset           |           |             |              |                 |
| 6   | Pay twice                        |           |             |              |                 |
| 7   | Pay with no reference            |           |             |              |                 |
| 8   | Wrong wallet                     |           |             |              |                 |
| 9   | Find a transaction               |           |             |              |                 |
| 10  | Download a report                |           |             |              |                 |
| 11  | Cancel a link                    |           |             |              |                 |
| 12  | Wallet problems                  |           |             |              |                 |

## Issues found and fixed

| #   | Found by | Issue | Severity | Fix (commit) | Regression test |
| --- | -------- | ----- | -------- | ------------ | --------------- |
|     |          |       |          |              |                 |

## Evidence

- `evidence.csv` from `npm run evidence` (every transfer with its Testnet hash and explorer link).
- `feedback.csv` from `GET /v1/feedback.csv`.
- Screenshots of each flagged case in the dashboard and the checkout.
