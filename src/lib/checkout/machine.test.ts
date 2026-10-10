import { describe, expect, it } from "vitest";
import type { Preflight } from "@/lib/api/client";
import { initialState, reduce, screenForProblem, type CheckoutEvent, type CheckoutState } from "./machine";

const fresh = () => initialState({ status: "AWAITING_PAYMENT", transactionHash: null, paidAt: null });
const run = (state: CheckoutState, ...events: CheckoutEvent[]) => events.reduce(reduce, state);
const preflight = { ok: true, balance: "120.50", needed: "25.00" } as Preflight;
const wallet = { id: "freighter" as const, address: "GABC" };

describe("checkout machine", () => {
  it("opens on the screen matching the payment's status", () => {
    expect(fresh().screen).toBe("selectMethod");
    expect(initialState({ status: "PAID", transactionHash: "ab", paidAt: "x" }).screen).toBe("alreadyPaid");
    expect(initialState({ status: "EXPIRED", transactionHash: null, paidAt: null }).screen).toBe("expired");
    expect(initialState({ status: "CONFIRMING", transactionHash: "ab", paidAt: null }).screen).toBe("pending");
    expect(initialState({ status: "FAILED", transactionHash: "ab", paidAt: null }).screen).toBe("failed");
  });

  it("walks the happy path", () => {
    let s = run(fresh(), { type: "CONTINUE" }, { type: "OPEN_WALLETS" });
    expect(s.walletPickerOpen).toBe(true);
    s = run(s, { type: "CONNECTING", walletId: "freighter" }, { type: "CONNECTED", wallet, preflight });
    expect(s.screen).toBe("review");
    expect(s.walletPickerOpen).toBe(false);
    s = run(s, { type: "PAY_STARTED" });
    expect(s.screen).toBe("awaitingApproval");
    s = run(s, { type: "SUBMITTED", status: "CONFIRMING", transactionHash: "ab" });
    expect(s.screen).toBe("processing");
    s = run(s, { type: "STATUS", status: "PAID", transactionHash: "ab", paidAt: "now" });
    expect(s.screen).toBe("success");
  });

  it("never shows success for a submission alone", () => {
    const s = run(fresh(), { type: "CONTINUE" }, { type: "CONNECTED", wallet, preflight }, { type: "PAY_STARTED" }, {
      type: "SUBMITTED",
      status: "TRANSACTION_SUBMITTED",
      transactionHash: "ab",
    });
    expect(s.screen).not.toBe("success");
  });

  it("shows already-paid when someone else's payment lands while browsing", () => {
    const s = run(fresh(), { type: "CONTINUE" }, { type: "STATUS", status: "PAID", transactionHash: "ab" });
    expect(s.screen).toBe("alreadyPaid");
  });

  it("returns to review when the wallet prompt is cancelled", () => {
    const s = run(fresh(), { type: "CONNECTED", wallet, preflight }, { type: "PAY_STARTED" }, { type: "SIGN_CANCELLED" });
    expect(s.screen).toBe("review");
  });

  it("moves to pending when confirmation is slow, then to success", () => {
    let s = run(fresh(), { type: "CONNECTED", wallet, preflight }, { type: "PAY_STARTED" }, {
      type: "SUBMITTED",
      status: "CONFIRMING",
      transactionHash: "ab",
    }, { type: "STILL_PENDING" });
    expect(s.screen).toBe("pending");
    s = run(s, { type: "STATUS", status: "PAID", transactionHash: "ab" });
    expect(s.screen).toBe("success");
  });

  it("expires from any screen", () => {
    const s = run(fresh(), { type: "CONNECTED", wallet, preflight }, { type: "STATUS", status: "EXPIRED", transactionHash: null });
    expect(s.screen).toBe("expired");
  });

  it("only treats a lost wallet as a problem on the review screen", () => {
    const review = run(fresh(), { type: "CONNECTED", wallet, preflight });
    expect(run(review, { type: "WALLET_LOST" }).screen).toBe("walletDisconnected");
    const processing = run(review, { type: "PAY_STARTED" }, { type: "SUBMITTED", status: "CONFIRMING", transactionHash: "ab" });
    expect(run(processing, { type: "WALLET_LOST" }).screen).toBe("processing");
  });

  it("maps problem codes to their screens", () => {
    expect(screenForProblem("INSUFFICIENT_USDC")).toBe("insufficientUsdc");
    expect(screenForProblem("INSUFFICIENT_XLM")).toBe("insufficientXlm");
    expect(screenForProblem("NO_USDC_TRUSTLINE")).toBe("wrongNetwork");
    expect(screenForProblem("ACCOUNT_NOT_FOUND")).toBe("wrongNetwork");
    expect(screenForProblem("PAYMENT_EXPIRED")).toBe("expired");
    expect(screenForProblem("ALREADY_PAID")).toBe("alreadyPaid");
    expect(screenForProblem("SOMETHING_ELSE")).toBe("failed");
  });

  it("treats a payment from a wallet app as this customer's success", () => {
    let s = run(fresh(), { type: "CONTINUE" }, { type: "OPEN_WALLETS" }, { type: "OPEN_WALLET_APP" });
    expect(s.screen).toBe("walletApp");
    expect(s.walletPickerOpen).toBe(false);
    s = run(s, { type: "STATUS", status: "PAID", transactionHash: "ab", paidAt: "now" });
    expect(s.screen).toBe("success");
  });

  it("leaves wallet-app mode when the customer goes back", () => {
    const s = run(fresh(), { type: "CONTINUE" }, { type: "OPEN_WALLET_APP" }, { type: "BACK" });
    expect(s.screen).toBe("summary");
    expect(run(s, { type: "STATUS", status: "PAID", transactionHash: "ab" }).screen).toBe("alreadyPaid");
  });

  it("remembers which problem led to a shared screen", () => {
    const s = run(fresh(), { type: "CONTINUE" }, { type: "PROBLEM", code: "NO_USDC_TRUSTLINE" });
    expect(s.screen).toBe("wrongNetwork");
    expect(s.problemCode).toBe("NO_USDC_TRUSTLINE");
  });

  it("handles wallet connection failures", () => {
    const open = run(fresh(), { type: "CONTINUE" }, { type: "OPEN_WALLETS" }, { type: "CONNECTING", walletId: "freighter" });
    expect(run(open, { type: "WALLET_MISSING" }).screen).toBe("walletNotInstalled");
    expect(run(open, { type: "WALLET_REJECTED" }).screen).toBe("connectionRejected");
    expect(run(open, { type: "WALLET_REJECTED" }).lastWalletId).toBe("freighter");
  });
});
